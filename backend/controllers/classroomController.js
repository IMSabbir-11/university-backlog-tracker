const Classroom = require('../models/Classroom');
const { validationResult } = require('express-validator');

// Create new classroom with series and department
const createClassroom = async (req, res) => {
  try {
    console.log('📥 Create classroom request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { seriesNumber, departmentCode, totalStudents } = req.body;

    // Validation of new input format
    if (!seriesNumber || !/^\d{2}$/.test(seriesNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Series number must be a 2-digit number (e.g., 20, 21, 22)'
      });
    }

    if (!departmentCode || !/^\d{2}$/.test(departmentCode)) {
      return res.status(400).json({
        success: false,
        message: 'Department code must be a 2-digit number (e.g., 15 for CSE, 16 for EEE)'
      });
    }

    if (!totalStudents || totalStudents < 1 || totalStudents > 180) {
      return res.status(400).json({
        success: false,
        message: 'Total students must be between 1 and 180'
      });
    }

    const existingClassroom = await Classroom.findOne({ 
      seriesNumber,
      departmentCode,
      status: 'active'
    });
    
    if (existingClassroom) {
      return res.status(400).json({
        success: false,
        message: `Classroom for Series ${seriesNumber} - Department ${departmentCode} already exists.`
      });
    }

    console.log('✅ Creating classroom for Series:', seriesNumber, 'Dept:', departmentCode);

    const newClassroom = new Classroom({
      seriesNumber,
      departmentCode,
      totalStudents: parseInt(totalStudents),
      createdBy: req.user?.userId || 'admin'
    });

    const savedClassroom = await newClassroom.save();
    
    console.log('✅ Classroom created successfully:', {
      className: savedClassroom.className,
      seriesNumber: savedClassroom.seriesNumber,
      departmentCode: savedClassroom.departmentCode,
      studentsGenerated: savedClassroom.students.length,
      sampleRollNumbers: savedClassroom.students.slice(0, 3).map(s => s.rollNumber)
    });

    res.status(201).json({
      success: true,
      message: `Classroom created successfully for Series ${seriesNumber} - Department ${departmentCode} with ${savedClassroom.students.length} students`,
      data: savedClassroom
    });

  } catch (error) {
    console.error('❌ Error creating classroom:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This series and department combination already exists.'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating classroom',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get classrooms
const getAllClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .select('-students');

    res.json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    console.error('❌ Error fetching classrooms:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms'
    });
  }
};

const getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom || classroom.status === 'inactive') {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      data: classroom
    });
  } catch (error) {
    console.error('❌ Error fetching classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom'
    });
  }
};

// Update classroom
const updateClassroom = async (req, res) => {
  try {
    const { seriesNumber, departmentCode, totalStudents } = req.body;
    const classroomId = req.params.id;
    
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    if (seriesNumber) classroom.seriesNumber = seriesNumber;
    if (departmentCode) classroom.departmentCode = departmentCode;
    
    if (totalStudents && totalStudents !== classroom.totalStudents) {
      classroom.totalStudents = parseInt(totalStudents);
      await classroom.generateStudents();
    }

    classroom.className = `Series ${classroom.seriesNumber} - Dept ${classroom.departmentCode}`;

    const updatedClassroom = await classroom.save();

    res.json({
      success: true,
      message: 'Classroom updated successfully',
      data: updatedClassroom
    });
  } catch (error) {
    console.error('❌ Error updating classroom:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Classroom name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating classroom'
    });
  }
};

// delete classroom from database
const deleteClassroom = async (req, res) => {
  try {
    const classroomId = req.params.id;
    
    const deletedClassroom = await Classroom.findByIdAndDelete(classroomId);

    if (!deletedClassroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    console.log('✅ Classroom completely deleted:', deletedClassroom.className);

    res.json({
      success: true,
      message: `Classroom "${deletedClassroom.className}" has been permanently deleted`
    });
  } catch (error) {
    console.error('❌ Error deleting classroom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting classroom'
    });
  }
};

module.exports = {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom
};
