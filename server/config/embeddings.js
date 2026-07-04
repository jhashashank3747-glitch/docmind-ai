const { pipeline } = require('@xenova/transformers');

let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log('Loading embedding model (first time takes ~30 seconds)...');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded');
  }
  return embedder;
};

const generateEmbedding = async (text) => {
  try {
    const embedder = await getEmbedder();
    const output = await embedder(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  } catch (err) {
    throw new Error(`Embedding generation failed: ${err.message}`);
  }
};

module.exports = { generateEmbedding };