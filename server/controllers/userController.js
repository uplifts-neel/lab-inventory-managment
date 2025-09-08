const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('division', 'name')
      .populate('mentor', 'name role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, division, mentor } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed, role, division, mentor });
    await user.save();
    
    // Fetch the created user with populated fields
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('division', 'name')
      .populate('mentor', 'name role');
    
    res.status(201).json(populatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('division', 'name')
      .populate('mentor', 'name role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, division, mentor } = req.body;
    
    // Check if user exists
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const update = { name, email, role, division, mentor };
    
    // Only include fields that have values
    Object.keys(update).forEach(key => {
      if (update[key] === '' || update[key] === null || update[key] === undefined) {
        delete update[key];
      }
    });
    
    if (password && password.trim() !== '') {
      update.password = await bcrypt.hash(password, 10);
    } else {
      // Don't update password if not provided
      delete update.password;
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password')
      .populate('division', 'name')
      .populate('mentor', 'name role');
    
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
}; 