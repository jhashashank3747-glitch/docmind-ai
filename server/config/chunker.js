const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const words = text.split(' ');
  const chunks = [];

  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
    i += chunkSize - overlap;
  }

  return chunks;
};

module.exports = { chunkText };