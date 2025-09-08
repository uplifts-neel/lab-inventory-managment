const Asset = require('../models/Asset');

exports.getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate('assignedTo');
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assets', error: err.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { type, brand, model, serialNo, purchaseDate, warrantyExpiry, amcExpiry, status, assignedTo, assignedToModel, details } = req.body;
    const asset = new Asset({ type, brand, model, serialNo, purchaseDate, warrantyExpiry, amcExpiry, status, assignedTo, assignedToModel, details });
    await asset.save();
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Error creating asset', error: err.message });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTo');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching asset', error: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { type, brand, model, serialNo, purchaseDate, warrantyExpiry, amcExpiry, status, assignedTo, assignedToModel, details } = req.body;
    const update = { type, brand, model, serialNo, purchaseDate, warrantyExpiry, amcExpiry, status, assignedTo, assignedToModel, details };
    const asset = await Asset.findByIdAndUpdate(req.params.id, update, { new: true }).populate('assignedTo');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: 'Error updating asset', error: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting asset', error: err.message });
  }
}; 