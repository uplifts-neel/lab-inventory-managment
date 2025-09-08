const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, division, mentor } = req.body;
    // Only admin can register new users
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admin can register users' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role, division, mentor });
    await user.save();
    res.status(201).json({ message: 'User registered', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Set defaults for optional fields
    const role = req.body.role || 'Trainee';
    const division = req.body.division || null;
    const mentor = req.body.mentor || null;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role, division, mentor });
    await user.save();
    // Auto-login after signup
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token: jwtToken, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Signup error', error: err.message });
  }
}; 