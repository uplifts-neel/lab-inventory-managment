const Division = require('../models/Division');

exports.getAllDivisions = async (req, res) => {
  try {
    console.log('=== GET ALL DIVISIONS ===');
    const divisions = await Division.find();
    console.log('Found divisions:', divisions.length);
    res.json(divisions);
  } catch (err) {
    console.error('Error fetching divisions:', err);
    res.status(500).json({ message: 'Error fetching divisions', error: err.message });
  }
};

exports.getDivisionById = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) return res.status(404).json({ message: 'Division not found' });
    res.json(division);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching division', error: err.message });
  }
};

exports.createDivision = async (req, res) => {
  try {
    console.log('=== CREATE DIVISION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { name, parent, projects } = req.body;
    console.log('Creating division with data:', { name, parent, projects });
    
    // Validate required fields
    if (!name || name.trim() === '') {
      console.log('Validation failed: name is empty');
      return res.status(400).json({ message: 'Division name is required' });
    }
    
    // Handle empty parent field
    const divisionData = { name, projects };
    if (parent && parent.trim() !== '') {
      divisionData.parent = parent;
    }
    
    console.log('Final division data:', divisionData);
    
    const division = new Division(divisionData);
    await division.save();
    console.log('Division created successfully:', division);
    res.status(201).json(division);
  } catch (err) {
    console.error('Error creating division:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Error creating division', error: err.message });
  }
};

exports.updateDivision = async (req, res) => {
  try {
    const { name, parent, projects } = req.body;
    console.log('Updating division with data:', { name, parent, projects });
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Division name is required' });
    }
    
    // Handle empty parent field
    const updateData = { name, projects };
    if (parent && parent.trim() !== '') {
      updateData.parent = parent;
    } else {
      updateData.parent = null; // Clear parent if empty
    }
    
    const division = await Division.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!division) return res.status(404).json({ message: 'Division not found' });
    console.log('Division updated successfully:', division);
    res.json(division);
  } catch (err) {
    console.error('Error updating division:', err);
    res.status(500).json({ message: 'Error updating division', error: err.message });
  }
};

exports.deleteDivision = async (req, res) => {
  try {
    const division = await Division.findByIdAndDelete(req.params.id);
    if (!division) return res.status(404).json({ message: 'Division not found' });
    res.json({ message: 'Division deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting division', error: err.message });
  }
}; 