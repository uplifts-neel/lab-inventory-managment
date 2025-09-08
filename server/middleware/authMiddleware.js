const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose'); // Import mongoose to generate a valid ObjectId

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // DEV: Accept mock-token for development/demo
  if (authHeader === 'Bearer mock-token') {
    // Use a valid, but dummy, MongoDB ObjectId for the mock user
    req.user = { _id: new mongoose.Types.ObjectId('60d5ec49f8c7d10015f8e123'), name: 'Demo Admin', role: 'Admin' }; // Using a fixed dummy ObjectId
    return next();
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware; 