const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['enrolled', 'graduated', 'dropped'],
    default: 'enrolled'
  }
}, { _id: true });

const classroomSchema = new mongoose.Schema({
  seriesNumber: {
    type: String,
    required: [true, 'Series number is required'],
    minlength: [2, 'Series number must be 2 digits'],
    maxlength: [2, 'Series number must be 2 digits'],
    match: [/^\d{2}$/, 'Series number must be a 2-digit number']
  },
  departmentCode: {
    type: String,
    required: [true, 'Department code is required'],
    minlength: [2, 'Department code must be 2 digits'],
    maxlength: [2, 'Department code must be 2 digits'],
    match: [/^\d{2}$/, 'Department code must be a 2-digit number']
  },
  totalStudents: {
    type: Number,
    required: [true, 'Total students count is required'],
    min: [1, 'Must have at least 1 student'],
    max: [180, 'Cannot exceed 180 students']
  },
  className: {
    type: String,
    default: function() {
      return `Series ${this.seriesNumber} - Dept ${this.departmentCode}`;
    }
  },
  students: {
    type: [studentSchema],
    default: []
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  classCode: {
    type: String,
    unique: true,
    default: function() {
      return `CLS${this.seriesNumber}${this.departmentCode}`;
    }
  }
}, {
  timestamps: true
});

classroomSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      console.log('🔄 Pre-save hook: Setting up new classroom...');
      
      if (!this.className) {
        this.className = `Series ${this.seriesNumber} - Dept ${this.departmentCode}`;
        console.log('✅ Generated className:', this.className);
      }
      
      if (!this.classCode) {
        this.classCode = `CLS${this.seriesNumber}${this.departmentCode}`;
        console.log('✅ Generated classCode:', this.classCode);
      }
      
      if (this.students.length === 0) {
        console.log('🔄 Generating students with new roll number format...');
        await this.generateStudents();
        console.log('✅ Generated', this.students.length, 'students');
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error in pre-save hook:', error);
    next(error);
  }
});

classroomSchema.methods.generateStudents = async function() {
  try {
    const students = [];
    
    console.log('🔄 Generating students for Series:', this.seriesNumber, 'Dept:', this.departmentCode);
    
    for (let i = 1; i <= this.totalStudents; i++) {
      const studentNumber = i.toString().padStart(3, '0');
      const rollNumber = `${this.seriesNumber}${this.departmentCode}${studentNumber}`;
      const registrationNumber = `REG${rollNumber}`;
      
      students.push({
        rollNumber,
        registrationNumber,
        name: `Student ${rollNumber}`,
        status: 'enrolled'
      });
    }
    
    this.students = students;
    console.log('✅ Students generated with 3-digit format:', students.slice(0, 3).map(s => s.rollNumber));
    return students;
  } catch (error) {
    console.error('❌ Error generating students:', error);
    throw error;
  }
};


classroomSchema.index({ seriesNumber: 1, departmentCode: 1 }, { unique: true });
classroomSchema.index({ classCode: 1 });
classroomSchema.index({ status: 1 });
classroomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Classroom', classroomSchema);
