const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  type: { type: String, required: true },
  brand: String,
  model: String,
  serialNo: { type: String, required: true, unique: true },
  purchaseDate: Date,
  warrantyExpiry: Date,
  amcExpiry: Date,
  status: { type: String, enum: ['Assigned', 'Unassigned', 'In Repair', 'In AMC'], default: 'Unassigned' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, refPath: 'assignedToModel' },
  assignedToModel: { type: String, enum: ['User', 'Division'] },
  assignmentHistory: [
    {
      assignedTo: { type: mongoose.Schema.Types.ObjectId, refPath: 'assignmentHistory.assignedToModel' },
      assignedToModel: String,
      date: Date,
      action: String
    }
  ],
  details: { type: Object }
});

module.exports = mongoose.model('Asset', assetSchema); 