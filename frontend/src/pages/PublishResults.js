import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const PublishResults = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishingResults, setPublishingResults] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    status: 'passed',
    semester: ''
  });
  const [studentCourses, setStudentCourses] = useState([]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, [token]);

  useEffect(() => {
    fetchClassrooms();
  }, [token]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/results/classrooms');
      
      if (response.data.success) {
        setClassrooms(response.data.data || []);
      } else {
        toast.error('Failed to fetch classrooms');
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassroomResults = async (classroomId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/results/classroom/${classroomId}`);
      
      if (response.data.success) {
        setSelectedClassroom(response.data.data.classroom);
        setStudents(response.data.data.students);
      } else {
        toast.error('Failed to fetch classroom results');
      }
    } catch (error) {
      console.error('Error fetching classroom results:', error);
      toast.error('Failed to load classroom results');
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomSelect = (classroom) => {
    fetchClassroomResults(classroom._id);
  };

  const openResultForm = (student) => {
    setSelectedStudent(student);
    setStudentCourses(student.results?.courses || []);
    setShowResultForm(true);
  };

  const addCourse = () => {
    if (!courseForm.courseCode || !courseForm.courseName || !courseForm.semester) {
      toast.error('Please fill in all course fields');
      return;
    }

    const existingCourse = studentCourses.find(course => 
      course.courseCode.toLowerCase() === courseForm.courseCode.toLowerCase()
    );

    if (existingCourse) {
      toast.error('Course already exists for this student');
      return;
    }

    const newCourse = {
      ...courseForm,
      courseCode: courseForm.courseCode.toUpperCase(),
      _id: Date.now().toString() // Temporary ID for frontend
    };

    setStudentCourses([...studentCourses, newCourse]);
    setCourseForm({
      courseCode: '',
      courseName: '',
      status: 'passed',
      semester: ''
    });
    toast.success('Course added successfully');
  };

  const removeCourse = (courseId) => {
    setStudentCourses(studentCourses.filter(course => course._id !== courseId));
    toast.success('Course removed');
  };

  const updateCourseStatus = (courseId, newStatus) => {
    setStudentCourses(studentCourses.map(course =>
      course._id === courseId ? { ...course, status: newStatus } : course
    ));
  };

  const publishResults = async () => {
    if (studentCourses.length === 0) {
      toast.error('Please add at least one course');
      return;
    }

    setPublishingResults(true);

    try {
      const response = await axios.post('/api/results/publish', {
        classroomId: selectedClassroom._id,
        studentRollNumber: selectedStudent.rollNumber,
        courses: studentCourses.map(course => ({
          courseCode: course.courseCode,
          courseName: course.courseName,
          status: course.status,
          semester: course.semester
        }))
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowResultForm(false);
        fetchClassroomResults(selectedClassroom._id); // Refresh data
      } else {
        toast.error(response.data.message || 'Failed to publish results');
      }
    } catch (error) {
      console.error('Error publishing results:', error);
      toast.error(error.response?.data?.message || 'Failed to publish results');
    } finally {
      setPublishingResults(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getResultSummary = (student) => {
    if (!student.results) return { total: 0, passed: 0, failed: 0 };
    return {
      total: student.results.totalCourses,
      passed: student.results.passedCourses,
      failed: student.results.failedCourses
    };
  };

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h2>📊 Publish Results</h2>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/admin-dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="admin-content">
        <div className="page-header">
          <h1>📊 Result Publication</h1>
          <p>Select a classroom to publish or update student results</p>
        </div>

        {!selectedClassroom ? (
          <div className="classroom-selection">
            <h3>📚 Select Classroom</h3>
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading classrooms...</p>
              </div>
            ) : classrooms.length === 0 ? (
              <div className="empty-state">
                <h3>🏫 No Classrooms Found</h3>
                <p>Create classrooms first to publish results</p>
                <button 
                  onClick={() => navigate('/manage-classrooms')}
                  className="create-btn"
                >
                  Create Classroom
                </button>
              </div>
            ) : (
              <div className="classrooms-grid">
                {classrooms.map((classroom) => (
                  <div 
                    key={classroom._id}
                    className="classroom-option"
                    onClick={() => handleClassroomSelect(classroom)}
                  >
                    <h4>{classroom.className}</h4>
                    <div className="classroom-info">
                      <span>🏷️ {classroom.classCode}</span>
                      <span>👥 {classroom.totalStudents} students</span>
                    </div>
                    <p>Click to manage results</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="results-management">
            <div className="classroom-header">
              <div className="classroom-info">
                <h3>🏫 {selectedClassroom.className}</h3>
                <span className="class-code">🏷️ {selectedClassroom.classCode}</span>
              </div>
              <button 
                onClick={() => setSelectedClassroom(null)}
                className="back-btn"
              >
                ← Back to Classrooms
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : (
              <div className="students-results-table">
                <table>
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Results Summary</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const summary = getResultSummary(student);
                      return (
                        <tr key={student.rollNumber}>
                          <td className="roll-number">{student.rollNumber}</td>
                          <td>{student.name}</td>
                          <td>
                            <div className="result-summary">
                              <span className="total">📚 {summary.total}</span>
                              <span className="passed">✅ {summary.passed}</span>
                              <span className="failed">❌ {summary.failed}</span>
                            </div>
                          </td>
                          <td>
                            {student.results?.lastUpdated 
                              ? new Date(student.results.lastUpdated).toLocaleDateString()
                              : 'Not published'
                            }
                          </td>
                          <td>
                            <button 
                              className="action-btn publish-btn"
                              onClick={() => openResultForm(student)}
                            >
                              {student.results ? '✏️ Edit Results' : '📝 Publish Results'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Result Publishing Modal */}
        {showResultForm && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>📊 Manage Results - {selectedStudent.name}</h3>
                <button onClick={() => setShowResultForm(false)} className="close-btn">✕</button>
              </div>

              <div className="result-form-content">
                <div className="student-info-header">
                  <div className="info-item">
                    <span>🎫 Roll: {selectedStudent.rollNumber}</span>
                  </div>
                  <div className="info-item">
                    <span>📄 Registration: {selectedStudent.registrationNumber}</span>
                  </div>
                </div>

                {/* Add Course Form */}
                <div className="add-course-section">
                  <h4>➕ Add New Course</h4>
                  <div className="course-form-grid">
                    <div className="form-group">
                      <label>Course Code:</label>
                      <input
                        type="text"
                        value={courseForm.courseCode}
                        onChange={(e) => setCourseForm({...courseForm, courseCode: e.target.value.toUpperCase()})}
                        placeholder="e.g., CSE3201"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Course Name:</label>
                      <input
                        type="text"
                        value={courseForm.courseName}
                        onChange={(e) => setCourseForm({...courseForm, courseName: e.target.value})}
                        placeholder="e.g., Database Management"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Semester:</label>
                      <input
                        type="text"
                        value={courseForm.semester}
                        onChange={(e) => setCourseForm({...courseForm, semester: e.target.value})}
                        placeholder="e.g., Fall 2024"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status:</label>
                      <select
                        value={courseForm.status}
                        onChange={(e) => setCourseForm({...courseForm, status: e.target.value})}
                        className="form-input"
                      >
                        <option value="passed">✅ Passed</option>
                        <option value="failed">❌ Failed</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={addCourse} className="add-course-btn">
                    ➕ Add Course
                  </button>
                </div>

                {/* Current Courses List */}
                <div className="courses-list-section">
                  <h4>📚 Current Courses ({studentCourses.length})</h4>
                  {studentCourses.length === 0 ? (
                    <div className="empty-courses">
                      <p>No courses added yet. Add courses using the form above.</p>
                    </div>
                  ) : (
                    <div className="courses-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Semester</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentCourses.map((course) => (
                            <tr key={course._id}>
                              <td className="course-code">{course.courseCode}</td>
                              <td>{course.courseName}</td>
                              <td>{course.semester}</td>
                              <td>
                                <select
                                  value={course.status}
                                  onChange={(e) => updateCourseStatus(course._id, e.target.value)}
                                  className="status-select"
                                >
                                  <option value="passed">✅ Passed</option>
                                  <option value="failed">❌ Failed</option>
                                </select>
                              </td>
                              <td>
                                <button 
                                  onClick={() => removeCourse(course._id)}
                                  className="remove-course-btn"
                                >
                                  🗑️ Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                  <button 
                    onClick={publishResults}
                    className="publish-btn"
                    disabled={publishingResults || studentCourses.length === 0}
                  >
                    {publishingResults ? '⏳ Publishing...' : '📢 Publish Results'}
                  </button>
                  <button 
                    onClick={() => setShowResultForm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishResults;
