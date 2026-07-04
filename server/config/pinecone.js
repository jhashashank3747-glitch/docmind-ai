const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeClient = null;

const getPinecone = () => {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
};

const getIndex = () => {
  const pc = getPinecone();
  return pc.index(process.env.PINECONE_INDEX);
};

module.exports = { getIndex };