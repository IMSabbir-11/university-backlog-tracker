const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getClassroomsForResults,
  getClassroomResults,
  publishStudentResults,
  getStudentResults,
  deleteCourseResult
} = require('../controllers/resultController');

// Validation for result publishing
const resultValidation = [
  body('classroomId')
    .notEmpty()
    .withMessage('Classroom ID is required'),
  body('studentRollNumber')
    .notEmpty()
    .withMessage('Student roll number is required'),
  body('courses')
    .isArray({ min: 1 })
    .withMessage('At least one course is required'),
  body('courses.*.courseCode')
    .notEmpty()
    .withMessage('Course code is required'),
  body('courses.*.courseName')
    .notEmpty()
    .withMessage('Course name is required'),
  body('courses.*.status')
    .isIn(['passed', 'failed'])
    .withMessage('Status must be either passed or failed'),
  body('courses.*.semester')
    .notEmpty()
    .withMessage('Semester is required')
];


router.get('/classrooms', [auth, adminAuth], getClassroomsForResults);
router.get('/classroom/:classroomId', [auth, adminAuth], getClassroomResults);
router.post('/publish', [auth, adminAuth, ...resultValidation], publishStudentResults);
router.get('/student/:studentRollNumber', auth, getStudentResults);
router.delete('/:classroomId/:studentRollNumber/:courseId', [auth, adminAuth], deleteCourseResult);

module.exports = router;
