const mongoose = require('mongoose');
require('dotenv').config();

const migrateStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fmpg');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({});

    console.log(`Found ${users.length} users to migrate`);

    let updatedCount = 0;
    for (const user of users) {
      const { employeeStatus, accountStatus, role } = user._doc;
      let newStatus = 'active';

      if (employeeStatus === 'former') {
        newStatus = 'former';
      } else if (employeeStatus === 'suspended' || accountStatus === 'suspended') {
        newStatus = 'suspended';
      } else if (employeeStatus === 'inactive' || accountStatus === 'inactive') {
        newStatus = 'inactive';
      } else if (accountStatus === 'pending') {
        // Since we are removing 'pending', we default them to 'active' 
        // as requested by the user ("new users would be active or inactive immediately")
        newStatus = 'active';
      }

      await User.updateOne(
        { _id: user._id },
        { 
          $set: { status: newStatus },
          $unset: { employeeStatus: "", accountStatus: "" }
        }
      );
      updatedCount++;
    }

    console.log(`Successfully migrated ${updatedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateStatus();
