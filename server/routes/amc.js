const express = require('express');
const router = express.Router();
const amcController = require('../controllers/amcController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all AMC tickets
router.get('/', authMiddleware, amcController.getAllAMCs);
// Create AMC ticket
router.post('/', authMiddleware, amcController.createAMC);
// Update AMC ticket
router.put('/:id', authMiddleware, amcController.updateAMC);

module.exports = router; 