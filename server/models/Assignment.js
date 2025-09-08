const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, refPath: 'assignedToModel', required: true },
  assignedToModel: { type: String, enum: ['User', 'Division'], required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  action: { type: String, enum: ['Assign', 'Transfer', 'Return', 'Unassign'], required: true },
  remarks: String
});

module.exports = mongoose.model('Assignment', assignmentSchema); 