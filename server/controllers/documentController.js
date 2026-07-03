const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const { generateEmbedding } = require('../config/embeddings');
const { chunkText } = require('../config/chunker');
const { getIndex } = require('../config/pinecone');

// UPLOAD AND PROCESS PDF
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create document record in MongoDB with 'processing' status
    const document = await Document.create({
      name: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy: req.userId,
      status: 'processing',
    });

    // Send response immediately — processing happens in background
    res.status(201).json({
      message: 'PDF uploaded, processing started',
      document,
    });

    // Process PDF asynchronously (after response is sent)
    processDocument(document, req.file.path);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// BACKGROUND PROCESSING FUNCTION
const processDocument = async (document, filePath) => {
  try {
    // Step 1: Extract text from PDF
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      await Document.findByIdAndUpdate(document._id, { status: 'failed' });
      return;
    }

    // Step 2: Split text into chunks
    const chunks = chunkText(extractedText);

    // Step 3: Generate embeddings and store in Pinecone
    const index = getIndex();
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);

      vectors.push({
        id: `${document._id}-chunk-${i}`,
        values: embedding,
        metadata: {
          documentId: document._id.toString(),
          documentName: document.originalName,
          chunkIndex: i,
          text: chunks[i],
        },
      });

      // Pinecone has batch limits — upsert every 50 vectors
      if (vectors.length === 50) {
        await index.upsert(vectors);
        vectors.length = 0;
      }
    }

    // Upsert any remaining vectors
    if (vectors.length > 0) {
      await index.upsert(vectors);
    }

    // Step 4: Update document status to 'ready'
    await Document.findByIdAndUpdate(document._id, {
      status: 'ready',
      totalChunks: chunks.length,
    });

    // Step 5: Clean up — delete the PDF file from disk
    fs.unlinkSync(filePath);

    console.log(`Document ${document.originalName} processed: ${chunks.length} chunks`);
  } catch (err) {
    console.error('Processing error:', err.message);
    await Document.findByIdAndUpdate(document._id, { status: 'failed' });
  }
};

// GET ALL DOCUMENTS FOR A USER
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ uploadedBy: req.userId })
      .sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE A DOCUMENT
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete all vectors from Pinecone for this document
    const index = getIndex();
    
    // Get all chunk IDs for this document
    const chunkIds = Array.from(
      { length: document.totalChunks },
      (_, i) => `${document._id}-chunk-${i}`
    );

    if (chunkIds.length > 0) {
      await index.deleteMany(chunkIds);
    }

    // Delete from MongoDB
    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };