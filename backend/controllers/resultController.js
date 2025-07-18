const Result = require('../models/Result');
const Classroom = require('../models/Classroom');
const { validationResult } = require('express-validator');

// all classrooms for result publishing
const getClassroomsForResults = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ 
      status: 'active',
      createdBy: req.user?.userId || 'admin'
    })
    .select('className seriesNumber departmentCode totalStudents classCode createdAt')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    console.error('❌ Error fetching classrooms for results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms'
    });
  }
};

// Getting students and their results for a specific classroom
const getClassroomResults = async (req, res) => {
  try {
    const { classroomId } = req.params;

    // Get classroom with students
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // existing results for this classroom
    const existingResults = await Result.find({ classroom: classroomId });
    
    // Creating a map of existing results by roll number
    const resultsMap = {};
    existingResults.forEach(result => {
      resultsMap[result.studentRollNumber] = result;
    });

    // Combining student data with their results
    const studentsWithResults = classroom.students.map(student => ({
      _id: student._id,
      rollNumber: student.rollNumber,
      registrationNumber: student.registrationNumber,
      name: student.name,
      status: student.status,
      results: resultsMap[student.rollNumber] || null
    }));

    res.json({
      success: true,
      data: {
        classroom: {
          _id: classroom._id,
          className: classroom.className,
          seriesNumber: classroom.seriesNumber,
          departmentCode: classroom.departmentCode,
          classCode: classroom.classCode
        },
        students: studentsWithResults
      }
    });
  } catch (error) {
    console.error('❌ Error fetching classroom results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classroom results'
    });
  }
};

// Publish or update results for a student
const publishStudentResults = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { classroomId, studentRollNumber, courses } = req.body;

    console.log('📥 Publishing results for:', { classroomId, studentRollNumber, courses });

    // Validating classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Validating student exists
    const student = classroom.students.find(s => s.rollNumber === studentRollNumber);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in this classroom'
      });
    }

    // Checking if results already exist for this student
    let existingResult = await Result.findOne({
      classroom: classroomId,
      studentRollNumber: studentRollNumber
    });

    if (existingResult) {
      // Update existing results
      existingResult.courses = courses.map(course => ({
        ...course,
        lastModified: new Date()
      }));
      existingResult.publishedBy = req.user?.userId || 'admin';
      
      const updatedResult = await existingResult.save();
      
      console.log('✅ Results updated for student:', studentRollNumber);
      
      res.json({
        success: true,
        message: `Results updated successfully for ${student.name}`,
        data: updatedResult
      });
    } else {
      // Create new results
      const newResult = new Result({
        student: student._id,
        studentRollNumber: studentRollNumber,
        classroom: classroomId,
        courses: courses.map(course => ({
          ...course,
          publishedAt: new Date()
        })),
        publishedBy: req.user?.userId || 'admin'
      });

      const savedResult = await newResult.save();
      
      console.log('✅ Results published for student:', studentRollNumber);
      
      res.status(201).json({
        success: true,
        message: `Results published successfully for ${student.name}`,
        data: savedResult
      });
    }
  } catch (error) {
    console.error('❌ Error publishing results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while publishing results'
    });
  }
};

// Getting student results (for student dashboard)
const getStudentResults = async (req, res) => {
  try {
    const { studentRollNumber } = req.params;

    const results = await Result.findOne({ 
      studentRollNumber: studentRollNumber 
    }).populate('classroom', 'className classCode');

    if (!results) {
      return res.json({
        success: true,
        data: {
          courses: [],
          totalCourses: 0,
          passedCourses: 0,
          failedCourses: 0,
          classroom: null
        }
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Error fetching student results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student results'
    });
  }
};

// Deleting course result
const deleteCourseResult = async (req, res) => {
  try {
    const { classroomId, studentRollNumber, courseId } = req.params;

    const result = await Result.findOne({
      classroom: classroomId,
      studentRollNumber: studentRollNumber
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Results not found'
      });
    }

    // Removing the specific course
    result.courses = result.courses.filter(course => course._id.toString() !== courseId);
    
    if (result.courses.length === 0) {
      await Result.findByIdAndDelete(result._id);
      res.json({
        success: true,
        message: 'All results deleted for student'
      });
    } else {
      await result.save();
      res.json({
        success: true,
        message: 'Course result deleted successfully',
        data: result
      });
    }
  } catch (error) {
    console.error('❌ Error deleting course result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course result'
    });
  }
};

module.exports = {
  getClassroomsForResults,
  getClassroomResults,
  publishStudentResults,
  getStudentResults,
  deleteCourseResult
};
