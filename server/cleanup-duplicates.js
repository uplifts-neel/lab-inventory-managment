const mongoose = require('mongoose');
const Assignment = require('./models/Assignment');
const Asset = require('./models/Asset');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/lims', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanupDuplicates() {
  try {
    console.log('Starting duplicate cleanup...');
    
    // Find all assignments
    const assignments = await Assignment.find({}).populate('asset assignedTo');
    
    // Group by asset and assignedTo
    const groups = {};
    assignments.forEach(assignment => {
      const key = `${assignment.asset._id}-${assignment.assignedTo._id}-${assignment.action}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(assignment);
    });
    
    // Remove duplicates, keeping only the most recent one
    let removedCount = 0;
    for (const [key, group] of Object.entries(groups)) {
      if (group.length > 1) {
        // Sort by date, keep the most recent
        group.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Remove all except the first (most recent)
        const toRemove = group.slice(1);
        for (const assignment of toRemove) {
          await Assignment.findByIdAndDelete(assignment._id);
          removedCount++;
          console.log(`Removed duplicate assignment: ${assignment._id}`);
        }
      }
    }
    
    console.log(`Cleanup completed! Removed ${removedCount} duplicate assignments.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates(); 