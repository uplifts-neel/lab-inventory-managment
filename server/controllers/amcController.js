const AMCTicket = require('../models/AMCTicket');
const Asset = require('../models/Asset');
const User = require('../models/User');

exports.getAllAMCs = async (req, res) => {
  try {
    console.log('=== GET ALL AMC TICKETS ===');
    const amcs = await AMCTicket.find()
      .populate('asset', 'type brand model serialNo name')
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    console.log('Found AMC tickets:', amcs.length);
    res.json(amcs);
  } catch (err) {
    console.error('Error fetching AMC tickets:', err);
    res.status(500).json({ message: 'Error fetching AMC tickets', error: err.message });
  }
};

exports.createAMC = async (req, res) => {
  try {
    console.log('=== CREATE AMC TICKET ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { asset, raisedBy, assignedTo, status, remarks } = req.body;
    
    // Validate required fields
    if (!asset) {
      console.log('Validation failed: asset is required');
      return res.status(400).json({ message: 'Asset is required' });
    }
    
    // Validate ObjectId format for asset
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(asset)) {
      console.log('Invalid asset ID format:', asset);
      return res.status(400).json({ message: 'Invalid asset ID format' });
    }
    
    // Check if asset exists
    const assetExists = await Asset.findById(asset);
    if (!assetExists) {
      console.log('Asset not found:', asset);
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    // Validate raisedBy (use current user if not provided)
    const actualRaisedBy = raisedBy || req.user._id;
    if (!mongoose.Types.ObjectId.isValid(actualRaisedBy)) {
      console.log('Invalid raisedBy ID format:', actualRaisedBy);
      return res.status(400).json({ message: 'Invalid raisedBy ID format' });
    }
    
    // Check if user exists
    const userExists = await User.findById(actualRaisedBy);
    if (!userExists) {
      console.log('User not found:', actualRaisedBy);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate assignedTo if provided
    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      console.log('Invalid assignedTo ID format:', assignedTo);
      return res.status(400).json({ message: 'Invalid assignedTo ID format' });
    }
    
    if (assignedTo) {
      const assignedUserExists = await User.findById(assignedTo);
      if (!assignedUserExists) {
        console.log('Assigned user not found:', assignedTo);
        return res.status(404).json({ message: 'Assigned user not found' });
      }
    }
    
    console.log('Creating AMC ticket with data:', { asset, raisedBy: actualRaisedBy, assignedTo, status, remarks });
    
    const amc = new AMCTicket({ 
      asset, 
      raisedBy: actualRaisedBy, 
      assignedTo: assignedTo || null, 
      status: status || 'Open', 
      remarks: remarks || '',
      history: [{ 
        status: status || 'Open', 
        date: new Date(), 
        remarks: remarks || '' 
      }] 
    });
    
    await amc.save();
    console.log('AMC ticket created successfully:', amc);
    
    // Populate the created AMC ticket for response
    const populatedAMC = await AMCTicket.findById(amc._id)
      .populate('asset', 'type brand model serialNo name')
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email');
    
    res.status(201).json(populatedAMC);
  } catch (err) {
    console.error('=== CREATE AMC TICKET ERROR ===');
    console.error('Error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Error creating AMC ticket', error: err.message });
  }
};

exports.updateAMC = async (req, res) => {
  try {
    console.log('=== UPDATE AMC TICKET ===');
    console.log('AMC ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const { status, remarks, assignedTo } = req.body;
    
    const amc = await AMCTicket.findById(req.params.id);
    if (!amc) {
      console.log('AMC ticket not found:', req.params.id);
      return res.status(404).json({ message: 'AMC ticket not found' });
    }
    
    // Validate assignedTo if provided
    if (assignedTo) {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        console.log('Invalid assignedTo ID format:', assignedTo);
        return res.status(400).json({ message: 'Invalid assignedTo ID format' });
      }
      
      const assignedUserExists = await User.findById(assignedTo);
      if (!assignedUserExists) {
        console.log('Assigned user not found:', assignedTo);
        return res.status(404).json({ message: 'Assigned user not found' });
      }
    }
    
    // Update fields
    if (status) amc.status = status;
    if (remarks !== undefined) amc.remarks = remarks;
    if (assignedTo !== undefined) amc.assignedTo = assignedTo || null;
    
    // Add to history
    amc.history.push({ 
      status: status || amc.status, 
      date: new Date(), 
      remarks: remarks || '' 
    });
    
    amc.updatedAt = new Date();
    await amc.save();
    
    console.log('AMC ticket updated successfully');
    
    // Populate the updated AMC ticket for response
    const populatedAMC = await AMCTicket.findById(amc._id)
      .populate('asset', 'type brand model serialNo name')
      .populate('raisedBy', 'name email')
      .populate('assignedTo', 'name email');
    
    res.json(populatedAMC);
  } catch (err) {
    console.error('=== UPDATE AMC TICKET ERROR ===');
    console.error('Error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Error updating AMC ticket', error: err.message });
  }
}; 