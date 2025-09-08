const mongoose = require('mongoose');
const User = require('./models/User');
const Asset = require('./models/Asset');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lims', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedData() {
  try {
    console.log('Starting to seed data...');
    
    // Check if users exist
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} existing users`);
    
    if (userCount === 0) {
      // Create sample user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const sampleUser = new User({
        name: 'Sample User',
        email: 'sample@example.com',
        password: hashedPassword,
        role: 'Trainee'
      });
      await sampleUser.save();
      console.log('Sample user created:', sampleUser._id);
    }
    
    // Check if assets exist
    const assetCount = await Asset.countDocuments();
    console.log(`Found ${assetCount} existing assets`);
    
    if (assetCount === 0) {
      // Create sample assets
      const sampleAssets = [
        {
          name: 'Sample PC',
          type: 'PC',
          brand: 'Dell',
          model: 'Optiplex',
          serialNo: 'PC1001',
          status: 'Unassigned'
        },
        {
          name: 'Sample Printer',
          type: 'Printer',
          brand: 'HP',
          model: 'LaserJet',
          serialNo: 'PR2002',
          status: 'Unassigned'
        }
      ];
      
      for (const assetData of sampleAssets) {
        const asset = new Asset(assetData);
        await asset.save();
        console.log('Sample asset created:', asset._id);
      }
    }
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData(); 