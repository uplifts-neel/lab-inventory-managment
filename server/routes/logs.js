const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get all logs (admin only)
router.get('/', authMiddleware, roleMiddleware('Admin'), auditLogController.getAllLogs);

module.exports = router; 