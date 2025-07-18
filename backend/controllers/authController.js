const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const Classroom = require('../models/Classroom');
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // TODO: Replace with actual database logic
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@academitrack.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    if (email === adminEmail && password === adminPassword) {
      const token = generateToken('admin-id', 'admin');
      
      res.json({
        success: true,
        token,
        user: {
          id: 'admin-id',
          email: adminEmail,
          role: 'admin',
          universityName: process.env.UNIVERSITY_NAME || 'AcademiTrack University'
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

//Student Login
const studentLogin = async (req, res) => {
  try {
    console.log('📥 Student login request received:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { rollNumber, registrationNumber } = req.body;

    console.log('🔍 Searching for student with credentials:', { 
      rollNumber, 
      registrationNumber 
    });

    const classroom = await Classroom.findOne({
      status: 'active',
      $and: [
        { 'students.rollNumber': rollNumber },
        { 'students.registrationNumber': registrationNumber }
      ]
    });

    console.log('🏫 Classroom search result:', classroom ? 'Found' : 'Not found');

    if (!classroom) {
      console.log('❌ No classroom found with matching student');
      
      // Additional debugging: Check if student exists with either credential
      const rollOnlyCheck = await Classroom.findOne({
        status: 'active',
        'students.rollNumber': rollNumber
      });
      
      const regOnlyCheck = await Classroom.findOne({
        status: 'active',
        'students.registrationNumber': registrationNumber
      });

      console.log('🔍 Debug info:');
      console.log('  - Roll number exists:', rollOnlyCheck ? 'Yes' : 'No');
      console.log('  - Registration exists:', regOnlyCheck ? 'Yes' : 'No');

      return res.status(401).json({ 
        message: 'Invalid credentials. Student not found or not enrolled in any active classroom.' 
      });
    }

    // Find the specific student within the classroom
    const student = classroom.students.find(s => 
      s.rollNumber === rollNumber && s.registrationNumber === registrationNumber
    );

    if (!student) {
      console.log('❌ Student credentials do not match within classroom');
      return res.status(401).json({ 
        message: 'Invalid roll number and registration number combination.' 
      });
    }

    console.log('✅ Student found:', {
      rollNumber: student.rollNumber,
      name: student.name,
      classroom: classroom.className
    });

    // Generate token for the student
    const token = generateToken(student._id, 'student');
    
    const response = {
      success: true,
      token,
      user: {
        id: student._id,
        rollNumber: student.rollNumber,
        registrationNumber: student.registrationNumber,
        name: student.name,
        role: 'student',
        status: student.status,
        classroom: {
          id: classroom._id,
          name: classroom.className,
          classCode: classroom.classCode,
          seriesNumber: classroom.seriesNumber,
          departmentCode: classroom.departmentCode
        }
      }
    };

    console.log('✅ Student login successful');
    res.json(response);

  } catch (error) {
    console.error('💥 Server error during student login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


module.exports = {
  adminLogin,
  studentLogin
};
