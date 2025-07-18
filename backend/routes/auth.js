const express = require('express');
const router = express.Router();
const { adminLogin, studentLogin } = require('../controllers/authController');
const { body } = require('express-validator');

// Admin Login route
router.post('/admin', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], adminLogin);

// Student Login route
router.post('/student', [
  body('rollNumber', 'Roll number is required').not().isEmpty(),
  body('registrationNumber', 'Registration number is required').not().isEmpty()
], studentLogin);

module.exports = router;
