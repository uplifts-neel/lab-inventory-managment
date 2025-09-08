const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
  projects: [String],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }]
});

module.exports = mongoose.model('Division', divisionSchema); 