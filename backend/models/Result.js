const mongoose = require('mongoose');

const courseResultSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['passed', 'failed'],
    required: [true, 'Course status is required']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required']
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentRollNumber: {
    type: String,
    required: true,
    index: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  courses: [courseResultSchema],
  totalCourses: {
    type: Number,
    default: 0
  },
  passedCourses: {
    type: Number,
    default: 0
  },
  failedCourses: {
    type: Number,
    default: 0
  },
  publishedBy: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  }
}, {
  timestamps: true
});

resultSchema.pre('save', function(next) {
  this.totalCourses = this.courses.length;
  this.passedCourses = this.courses.filter(course => course.status === 'passed').length;
  this.failedCourses = this.courses.filter(course => course.status === 'failed').length;
  this.lastUpdated = new Date();
  next();
});

resultSchema.index({ classroom: 1, studentRollNumber: 1 });
resultSchema.index({ 'courses.courseCode': 1 });
resultSchema.index({ publishedBy: 1 });

module.exports = mongoose.model('Result', resultSchema);
