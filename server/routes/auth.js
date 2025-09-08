const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Login
router.post('/login', authController.login);
// Register (admin only)
router.post('/register', authMiddleware, authController.register);
// Get current user
router.get('/me', authMiddleware, authController.getMe);
// Public signup
router.post('/signup', authController.signup);

module.exports = router; 