const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all assets
router.get('/', authMiddleware, assetController.getAllAssets);
// Create asset
router.post('/', authMiddleware, assetController.createAsset);
// Get single asset
router.get('/:id', authMiddleware, assetController.getAssetById);
// Update asset
router.put('/:id', authMiddleware, assetController.updateAsset);
// Delete asset
router.delete('/:id', authMiddleware, assetController.deleteAsset);

module.exports = router; 