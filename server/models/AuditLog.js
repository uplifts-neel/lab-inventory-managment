const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  targetType: String,
  targetId: String,
  details: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema); 