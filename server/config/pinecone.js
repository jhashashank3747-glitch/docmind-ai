const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const getIndex = () => pinecone.index(process.env.PINECONE_INDEX);

module.exports = { pinecone, getIndex };