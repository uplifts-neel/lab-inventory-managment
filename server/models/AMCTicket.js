const mongoose = require('mongoose');

const amcTicketSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  history: [
    {
      status: String,
      date: Date,
      remarks: String
    }
  ]
});

module.exports = mongoose.model('AMCTicket', amcTicketSchema); 