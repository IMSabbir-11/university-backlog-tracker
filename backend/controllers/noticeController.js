const Notice = require('../models/Notice');
const Classroom = require('../models/Classroom');
const { validationResult } = require('express-validator');

// all classrooms for notice targeting
const getClassroomsForNotices = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ 
      status: 'active',
      createdBy: req.user?.userId || 'admin'
    })
    .select('className seriesNumber departmentCode totalStudents classCode')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    console.error('❌ Error fetching classrooms for notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching classrooms'
    });
  }
};

// Creating new notice
const createNotice = async (req, res) => {
  try {
    console.log('📥 Create notice request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { subject, description, targetClassrooms, targetType, priority } = req.body;

    let classroomIds = [];
    
    if (targetType === 'all') {
      // Get all active classrooms
      const allClassrooms = await Classroom.find({ 
        status: 'active',
        createdBy: req.user?.userId || 'admin'
      }).select('_id');
      classroomIds = allClassrooms.map(classroom => classroom._id);
    } else {
      classroomIds = targetClassrooms;
    }

    if (classroomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No target classrooms specified'
      });
    }

    const newNotice = new Notice({
      subject: subject.trim(),
      description: description.trim(),
      targetClassrooms: classroomIds,
      targetType,
      priority: priority || 'medium',
      publishedBy: req.user?.userId || 'admin'
    });

    const savedNotice = await newNotice.save();
    
    await savedNotice.populate('targetClassrooms', 'className classCode');
    
    console.log('✅ Notice created successfully:', savedNotice.subject);

    res.status(201).json({
      success: true,
      message: `Notice "${savedNotice.subject}" published successfully to ${classroomIds.length} classroom(s)`,
      data: savedNotice
    });

  } catch (error) {
    console.error('❌ Error creating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notice'
    });
  }
};

// Get all notices (admin view)
const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find({
      publishedBy: req.user?.userId || 'admin'
    })
    .populate('targetClassrooms', 'className classCode')
    .sort({ publishedAt: -1 });

    res.json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    console.error('❌ Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices'
    });
  }
};

//notices for specific student
const getStudentNotices = async (req, res) => {
  try {
    const { studentRollNumber } = req.params;
    
    // Find student's classroom
    const classroom = await Classroom.findOne({
      'students.rollNumber': studentRollNumber,
      status: 'active'
    });

    if (!classroom) {
      return res.json({
        success: true,
        data: [],
        unseenCount: 0
      });
    }

    const notices = await Notice.find({
      targetClassrooms: classroom._id,
      status: 'published'
    })
    .populate('targetClassrooms', 'className classCode')
    .sort({ publishedAt: -1 });

    // Calculation of unseen count
    const unseenCount = notices.filter(notice => 
      !notice.seenBy.some(seen => seen.studentRollNumber === studentRollNumber)
    ).length;

    res.json({
      success: true,
      data: notices,
      unseenCount,
      classroom: {
        id: classroom._id,
        name: classroom.className,
        code: classroom.classCode
      }
    });
  } catch (error) {
    console.error('❌ Error fetching student notices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices'
    });
  }
};

// Marking notice seen by student
const markNoticeAsSeen = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { studentRollNumber } = req.body;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const classroom = await Classroom.findOne({
      'students.rollNumber': studentRollNumber
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = classroom.students.find(s => s.rollNumber === studentRollNumber);
    
    await notice.markAsSeen(student._id, studentRollNumber);

    res.json({
      success: true,
      message: 'Notice marked as seen'
    });
  } catch (error) {
    console.error('❌ Error marking notice as seen:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notice as seen'
    });
  }
};

// Update notice
const updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { subject, description, priority } = req.body;

    const notice = await Notice.findById(noticeId);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Update fields
    if (subject) notice.subject = subject.trim();
    if (description) notice.description = description.trim();
    if (priority) notice.priority = priority;
    notice.lastModified = new Date();

    const updatedNotice = await notice.save();
    await updatedNotice.populate('targetClassrooms', 'className classCode');

    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: updatedNotice
    });
  } catch (error) {
    console.error('❌ Error updating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notice'
    });
  }
};

// Delete notice
const deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;

    const deletedNotice = await Notice.findByIdAndDelete(noticeId);
    if (!deletedNotice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.json({
      success: true,
      message: `Notice "${deletedNotice.subject}" deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting notice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notice'
    });
  }
};

module.exports = {
  getClassroomsForNotices,
  createNotice,
  getAllNotices,
  getStudentNotices,
  markNoticeAsSeen,
  updateNotice,
  deleteNotice
};
