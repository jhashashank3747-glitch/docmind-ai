const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
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

    console.log('File received:', req.file.originalname);

    const document = await Document.create({
      name: req.file.filename,
      originalName: req.file.originalname,
      uploadedBy: req.userId,
      status: 'processing',
    });

    console.log('Document created in DB:', document._id);

    res.status(201).json({
      message: 'PDF uploaded, processing started',
      document,
    });

    console.log('Response sent, starting background processing...');

    setTimeout(() => {
      processDocument(document, req.file.path).catch((err) => {
        console.error('Unhandled processing error:', err.message);
        console.error(err);
      });
    }, 100);

  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// BACKGROUND PROCESSING FUNCTION
const processDocument = async (document, filePath) => {
  console.log('=== processDocument started ===');
  console.log('Document:', document.originalName);
  console.log('File path:', filePath);

  try {
    // Step 1: Check file exists
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist at path:', filePath);
      await Document.findByIdAndUpdate(document._id, { status: 'failed' });
      return;
    }

    // Step 2: Read file
    const fileBuffer = fs.readFileSync(filePath);
    console.log('File read successfully, size:', fileBuffer.length, 'bytes');

    // Step 3: Extract text from PDF
    let extractedText = '';
    try {
      console.log('Parsing PDF...');
      const pdfData = await pdf(fileBuffer);
      extractedText = pdfData.text;
      console.log('Text extracted successfully, length:', extractedText.length);
    } catch (pdfErr) {
      console.error('PDF parse error:', pdfErr.message);
      await Document.findByIdAndUpdate(document._id, { status: 'failed' });
      return;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('No text found in PDF — might be a scanned/image PDF');
      await Document.findByIdAndUpdate(document._id, { status: 'failed' });
      return;
    }

    // Step 4: Split into chunks
    const chunks = chunkText(extractedText);
    console.log('Split into', chunks.length, 'chunks');

    // Step 5: Generate embeddings
    console.log('Loading embedding model...');
    const index = getIndex();
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Generating embedding for chunk ${i + 1}/${chunks.length}`);
      const embedding = await generateEmbedding(chunks[i]);
      console.log('Embedding dimensions:', embedding.length);

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

     if (vectors.length === 50) {
  console.log('Upserting batch of 50 to Pinecone...');
  await index.upsert(vectors);
  vectors.splice(0, vectors.length);
}
    }

    if (vectors.length > 0) {
  console.log('Upserting final', vectors.length, 'vectors to Pinecone...');
  console.log('Sample vector id:', vectors[0].id);
  console.log('Sample vector dimensions:', vectors[0].values.length);
  console.log('Sample metadata:', vectors[0].metadata);
  
  try {
    await index.upsert(vectors);
    console.log('Pinecone upsert successful');
  } catch (pineconeErr) {
    console.error('Pinecone upsert error:', pineconeErr.message);
    console.error('Pinecone error details:', JSON.stringify(pineconeErr));
    throw pineconeErr;
  }
}

    // Step 6: Update status to ready
    await Document.findByIdAndUpdate(document._id, {
      status: 'ready',
      totalChunks: chunks.length,
    });
    console.log('Document status updated to ready');

    // Step 7: Delete PDF file
    fs.unlinkSync(filePath);
    console.log('PDF file deleted from disk');

    console.log(`✅ SUCCESS: ${document.originalName} processed with ${chunks.length} chunks`);

  } catch (err) {
    console.error('=== PROCESSING FAILED ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
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

    const index = getIndex();

    const chunkIds = Array.from(
      { length: document.totalChunks },
      (_, i) => `${document._id}-chunk-${i}`
    );

    if (chunkIds.length > 0) {
      await index.deleteMany(chunkIds);
    }

    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { uploadDocument, getDocuments, deleteDocument };