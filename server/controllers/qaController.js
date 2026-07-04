const { generateEmbedding } = require('../config/embeddings');
const { getIndex } = require('../config/pinecone');
const ChatHistory = require('../models/ChatHistory');
const Document = require('../models/Document');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ASK A QUESTION
const askQuestion = async (req, res) => {
  try {
    const { question, documentIds, chatId } = req.body;

    if (!question || !documentIds || documentIds.length === 0) {
      return res.status(400).json({ message: 'Question and documentIds are required' });
    }

    // Step 1: Convert question to embedding
    const questionEmbedding = await generateEmbedding(question);

    // Step 2: Search Pinecone for relevant chunks
    const index = getIndex();
    const searchResults = await index.query({
      vector: questionEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: {
        documentId: { $in: documentIds },
      },
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      return res.status(200).json({
        answer: "I couldn't find relevant information in the selected documents.",
        sources: [],
      });
    }

    // Step 3: Build context from retrieved chunks
    const context = searchResults.matches
      .map((match, i) => 
        `[Source ${i + 1} - ${match.metadata.documentName}]:\n${match.metadata.text}`
      )
      .join('\n\n');

    // Step 4: Send to Groq with context
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on provided document context. 
          Always base your answers on the context provided. 
          If the answer is not in the context, say so clearly.
          Be concise and accurate.`,
        },
        {
          role: 'user',
          content: `Context from documents:\n\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const answer = completion.choices[0].message.content;

    // Step 5: Build sources for citations
    const sources = searchResults.matches.map((match) => ({
      documentName: match.metadata.documentName,
      chunk: match.metadata.text.substring(0, 200) + '...',
      score: match.score,
    }));

    // Step 6: Save to chat history
    let chat;
    if (chatId) {
      // Add to existing chat
      chat = await ChatHistory.findById(chatId);
      if (chat) {
        chat.messages.push({ role: 'user', content: question });
        chat.messages.push({ role: 'assistant', content: answer, sources });
        await chat.save();
      }
    } else {
      // Create new chat
      chat = await ChatHistory.create({
        user: req.userId,
        documents: documentIds,
        title: question.substring(0, 50),
        messages: [
          { role: 'user', content: question },
          { role: 'assistant', content: answer, sources },
        ],
      });
    }

    res.status(200).json({
      answer,
      sources,
      chatId: chat._id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Q&A failed', error: err.message });
  }
};

// GET ALL CHAT HISTORIES FOR A USER
const getChatHistories = async (req, res) => {
  try {
    const chats = await ChatHistory.find({ user: req.userId })
      .select('title createdAt documents')
      .populate('documents', 'originalName')
      .sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET A SINGLE CHAT HISTORY
const getChatById = async (req, res) => {
  try {
    const chat = await ChatHistory.findById(req.params.id)
      .populate('documents', 'originalName');
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE A CHAT
const deleteChat = async (req, res) => {
  try {
    await ChatHistory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { askQuestion, getChatHistories, getChatById, deleteChat };