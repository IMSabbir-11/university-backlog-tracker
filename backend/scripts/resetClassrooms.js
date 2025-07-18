const mongoose = require('mongoose');
require('dotenv').config();

const resetClassrooms = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await mongoose.connection.db.dropCollection('classrooms');
    console.log('✅ Dropped classrooms collection for new 3-digit format');

    console.log('🎉 Database reset for 3-digit student numbers!');
    process.exit(0);
  } catch (error) {
    console.log('ℹ️ Collection already clean or doesn\'t exist');
    process.exit(0);
  }
};

resetClassrooms();
