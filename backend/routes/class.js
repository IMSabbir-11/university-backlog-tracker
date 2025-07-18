const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  createClassroom,
  getAllClassrooms,    
  getClassroomById,
  updateClassroom,
  deleteClassroom
} = require('../controllers/classroomController');

// Validation for classroom creation and update
const classroomValidation = [
  body('seriesNumber')
    .isLength({ min: 2, max: 2 })
    .withMessage('Series number must be exactly 2 digits')
    .matches(/^\d{2}$/)
    .withMessage('Series number must contain only digits'),
  body('departmentCode')
    .isLength({ min: 2, max: 2 })
    .withMessage('Department code must be exactly 2 digits')
    .matches(/^\d{2}$/)
    .withMessage('Department code must contain only digits'),
  body('totalStudents')
    .isInt({ min: 1, max: 180 })
    .withMessage('Total students must be between 1 and 180')
];

// Routes
router.get('/', [auth, adminAuth], getAllClassrooms);
router.post('/', [auth, adminAuth, ...classroomValidation], createClassroom);
router.get('/:id', [auth, adminAuth], getClassroomById);
router.put('/:id', [auth, adminAuth, ...classroomValidation], updateClassroom);
router.delete('/:id', [auth, adminAuth], deleteClassroom);

module.exports = router;
