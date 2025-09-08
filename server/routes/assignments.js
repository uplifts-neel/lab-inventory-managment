const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all assignments
router.get('/', authMiddleware, assignmentController.getAllAssignments);
// Create assignment
router.post('/', authMiddleware, assignmentController.createAssignment);
// Return asset
router.put('/:id/return', authMiddleware, assignmentController.returnAssignment);

module.exports = router; 