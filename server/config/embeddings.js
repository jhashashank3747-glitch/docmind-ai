const axios = require('axios');

const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const embedding = response.data;

    // Hugging Face returns nested array for batches, flatten if needed
    if (Array.isArray(embedding[0])) {
      return embedding[0];
    }
    return embedding;
  } catch (err) {
    throw new Error(`Embedding generation failed: ${err.message}`);
  }
};

module.exports = { generateEmbedding };