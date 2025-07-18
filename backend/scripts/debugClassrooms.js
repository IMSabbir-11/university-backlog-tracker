const mongoose = require('mongoose');
const Classroom = require('../models/Classroom');
require('dotenv').config();

const debugClassrooms = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const classrooms = await Classroom.find({});
    
    console.log('📊 Total classrooms found:', classrooms.length);
    
    classrooms.forEach((classroom, index) => {
      console.log(`\n🏫 Classroom ${index + 1}:`);
      console.log('  - ID:', classroom._id);
      console.log('  - Name:', classroom.className);
      console.log('  - Series:', classroom.seriesNumber);
      console.log('  - Department:', classroom.departmentCode);
      console.log('  - Status:', classroom.status);
      console.log('  - Total Students:', classroom.totalStudents);
      console.log('  - Actual Students:', classroom.students?.length || 0);
      
      if (classroom.students && classroom.students.length > 0) {
        console.log('  - Sample Students:');
        classroom.students.slice(0, 3).forEach((student, i) => {
          console.log(`    ${i + 1}. Roll: ${student.rollNumber}, Reg: ${student.registrationNumber}`);
        });
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugClassrooms();
