const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get all divisions
router.get('/', authMiddleware, divisionController.getAllDivisions);
// Create division (admin only)
router.post('/', authMiddleware, divisionController.createDivision);
// Get single division
router.get('/:id', authMiddleware, divisionController.getDivisionById);
// Update division (admin only)
router.put('/:id', authMiddleware, divisionController.updateDivision);
// Delete division (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), divisionController.deleteDivision);

module.exports = router; 