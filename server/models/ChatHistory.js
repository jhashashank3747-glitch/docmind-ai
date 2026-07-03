const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [
    {
      documentName: String,
      chunk: String,
    },
  ],
});

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    messages: [messageSchema],
    title: { type: String, default: 'New Chat' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);