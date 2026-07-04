const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { askQuestion, getChatHistories, getChatById, deleteChat } = require('../controllers/qaController');

router.post('/ask', protect, askQuestion);
router.get('/history', protect, getChatHistories);
router.get('/history/:id', protect, getChatById);
router.delete('/history/:id', protect, deleteChat);

module.exports = router;