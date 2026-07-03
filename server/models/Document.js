const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalChunks: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);