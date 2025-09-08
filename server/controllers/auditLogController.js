const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

exports.getAllLogs = async (req, res) => {
  try {
    const { action, user, startDate, endDate } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (user) filter.user = user;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const logs = await AuditLog.find(filter).populate('user', 'name email role').sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs', error: err.message });
  }
}; 