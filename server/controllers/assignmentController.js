const Assignment = require('../models/Assignment');
const Asset = require('../models/Asset');
const User = require('../models/User');

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('asset')
      .populate('assignedTo')
      .populate('assignedBy');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assignments', error: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    console.log('=== CREATE ASSIGNMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { asset, assignedTo, assignedToModel, assignedBy, action, remarks } = req.body;
    
    // Validate required fields
    if (!asset || !assignedTo || !action) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ message: 'Asset, assignedTo, and action are required' });
    }
    
    // Validate ObjectId format for asset and assignedTo
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(asset)) {
      console.log('Invalid asset ID format:', asset);
      return res.status(400).json({ message: 'Invalid asset ID format' });
    }
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      console.log('Invalid assignedTo ID format:', assignedTo);
      return res.status(400).json({ message: 'Invalid assignedTo ID format' });
    }
    
    // Check if asset exists
    const assetExists = await Asset.findById(asset);
    if (!assetExists) {
      console.log('Asset not found:', asset);
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    // Check if user exists
    const userExists = await User.findById(assignedTo);
    if (!userExists) {
      console.log('User not found:', assignedTo);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check for duplicate assignment within last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingAssignment = await Assignment.findOne({
      asset: asset,
      assignedTo: assignedTo,
      action: action,
      date: { $gte: fiveSecondsAgo }
    });
    
    if (existingAssignment) {
      console.log('Duplicate assignment detected, skipping...');
      return res.status(409).json({ message: 'Assignment already exists for this asset and user' });
    }
    
    console.log('Creating assignment with data:', { asset, assignedTo, assignedToModel, assignedBy, action, remarks });
    
    // Create assignment record
    try {
      const assignment = new Assignment({ 
        asset, 
        assignedTo, 
        assignedToModel: assignedToModel || 'User', 
        assignedBy: assignedBy || '60d5ec49f8c7d10015f8e123', // Using the same valid ObjectId as mock user
        action, 
        remarks 
      });
      
      await assignment.save();
      console.log('Assignment created successfully:', assignment);
    } catch (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      console.error('Assignment error stack:', assignmentError.stack);
      return res.status(500).json({ message: 'Error creating assignment', error: assignmentError.message });
    }
    
    // Update asset status and assignment
    try {
      console.log('Updating asset with ID:', asset);
      const updatedAsset = await Asset.findByIdAndUpdate(asset, {
        status: action === 'Assign' ? 'Assigned' : 'Unassigned',
        assignedTo,
        assignedToModel: assignedToModel || 'User',
        $push: {
          assignmentHistory: {
            assignedTo,
            assignedToModel: assignedToModel || 'User',
            date: new Date(),
            action
          }
        }
      }, { new: true });
      
      console.log('Asset updated successfully:', updatedAsset);
    } catch (assetUpdateError) {
      console.error('Error updating asset:', assetUpdateError);
      console.error('Asset update error stack:', assetUpdateError.stack);
      return res.status(500).json({ message: 'Error updating asset', error: assetUpdateError.message });
    }
    
    res.status(201).json({ message: 'Assignment created successfully' }); // Changed response
  } catch (err) {
    console.error('=== CREATE ASSIGNMENT ERROR ===');
    console.error('Error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Error creating assignment', error: err.message });
  }
};

exports.returnAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    // Mark asset as unassigned
    await Asset.findByIdAndUpdate(assignment.asset, {
      status: 'Unassigned',
      assignedTo: null,
      assignedToModel: null,
      $push: {
        assignmentHistory: {
          assignedTo: null,
          assignedToModel: null,
          date: new Date(),
          action: 'Return'
        }
      }
    });
    // Optionally update assignment record (add return date, etc.)
    res.json({ message: 'Asset returned' });
  } catch (err) {
    res.status(500).json({ message: 'Error returning asset', error: err.message });
  }
}; 