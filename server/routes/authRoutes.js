const express = require('express');
const router = express.Router();
const { signup, login, refresh } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', protect, (req, res) => {
  res.json({ message: 'Authenticated', userId: req.userId });
});

module.exports = router;