const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Notice subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Notice description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  targetClassrooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  }],
  targetType: {
    type: String,
    enum: ['specific', 'all'],
    required: true
  },
  publishedBy: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  seenBy: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    studentRollNumber: {
      type: String,
      required: true
    },
    seenAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

noticeSchema.index({ targetClassrooms: 1 });
noticeSchema.index({ publishedAt: -1 });
noticeSchema.index({ 'seenBy.studentRollNumber': 1 });
noticeSchema.index({ status: 1 });

// marking notice as seen by student
noticeSchema.methods.markAsSeen = function(studentId, studentRollNumber) {
  const existingSeen = this.seenBy.find(seen => 
    seen.studentRollNumber === studentRollNumber
  );
  
  if (!existingSeen) {
    this.seenBy.push({
      studentId,
      studentRollNumber,
      seenAt: new Date()
    });
  }
  
  return this.save();
};

module.exports = mongoose.model('Notice', noticeSchema);
