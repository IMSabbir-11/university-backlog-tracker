const mongoose = require('mongoose');
require('dotenv').config();

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop entire classrooms collection to remove all problematic indexes
    try {
      await db.dropCollection('classrooms');
      console.log('✅ Dropped classrooms collection completely');
    } catch (error) {
      console.log('ℹ️ Classrooms collection not found (already clean)');
    }

    // Create fresh collection with proper schema
    const Classroom = require('../models/Classroom');
    await Classroom.createIndexes();
    console.log('✅ Created fresh indexes');

    console.log('🎉 Database reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
