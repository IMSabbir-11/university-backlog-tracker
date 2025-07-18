const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getClassroomsForNotices,
  createNotice,
  getAllNotices,
  getStudentNotices,
  markNoticeAsSeen,
  updateNotice,
  deleteNotice
} = require('../controllers/noticeController');

// Validation for notice creation
const noticeValidation = [
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('targetType')
    .isIn(['specific', 'all'])
    .withMessage('Target type must be either specific or all'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent')
];


router.get('/classrooms', [auth, adminAuth], getClassroomsForNotices);
router.post('/', [auth, adminAuth, ...noticeValidation], createNotice);
router.get('/', [auth, adminAuth], getAllNotices);
router.get('/student/:studentRollNumber', auth, getStudentNotices);
router.post('/:noticeId/seen', auth, markNoticeAsSeen);
router.put('/:noticeId', [auth, adminAuth], updateNotice);
router.delete('/:noticeId', [auth, adminAuth], deleteNotice);

module.exports = router;
