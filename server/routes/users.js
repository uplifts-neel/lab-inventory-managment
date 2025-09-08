const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get all users (admin only)
router.get('/', authMiddleware, userController.getAllUsers);
// Create user
router.post('/', authMiddleware, userController.createUser);
// Get single user
router.get('/:id', authMiddleware, userController.getUserById);
// Update user
router.put('/:id', authMiddleware, userController.updateUser);
// Delete user (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), userController.deleteUser);

module.exports = router; 