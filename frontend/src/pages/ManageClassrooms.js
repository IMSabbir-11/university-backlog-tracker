import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ManageClassrooms = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [newClassroom, setNewClassroom] = useState({
    seriesNumber: '',
    departmentCode: '',
    totalStudents: ''
  });
  const [editClassroom, setEditClassroom] = useState({
    id: '',
    seriesNumber: '',
    departmentCode: '',
    totalStudents: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, [token]);

  useEffect(() => {
    const fetchWithTimeout = async () => {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('⏰ Fetch timeout - stopping loading');
          setLoading(false);
          toast.error('Loading took too long. Please refresh the page.');
        }
      }, 10000);

      try {
        await fetchClassrooms();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    fetchWithTimeout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setLoading(false);
        toast.error('Please login again');
        navigate('/');
        return;
      }

      const response = await axios.get('/api/classes', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.data.success) {
        setClassrooms(response.data.data || []);
      } else {
        setClassrooms([]);
        toast.error(response.data.message || 'Failed to fetch classrooms');
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/');
      } else {
        toast.error('Failed to load classrooms. Please try again.');
      }
      
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    
    // Enhanced validation for new structure
    if (!newClassroom.seriesNumber || !/^\d{2}$/.test(newClassroom.seriesNumber)) {
      toast.error('Please enter a valid 2-digit series number (e.g., 20, 21, 22)');
      return;
    }
    
    if (!newClassroom.departmentCode || !/^\d{2}$/.test(newClassroom.departmentCode)) {
      toast.error('Please enter a valid 2-digit department code (e.g., 15 for CSE)');
      return;
    }
    
    if (!newClassroom.totalStudents || newClassroom.totalStudents < 1 || newClassroom.totalStudents > 180) {
      toast.error('Please enter total students between 1 and 180');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post('/api/classes', {
        seriesNumber: newClassroom.seriesNumber.padStart(2, '0'),
        departmentCode: newClassroom.departmentCode.padStart(2, '0'),
        totalStudents: parseInt(newClassroom.totalStudents)
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (response.data.success) {
        toast.success(`🎉 ${response.data.message}`);
        setShowCreateForm(false);
        setNewClassroom({ seriesNumber: '', departmentCode: '', totalStudents: '' });
        await fetchClassrooms();
      } else {
        toast.error(response.data.message || 'Failed to create classroom');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          'Failed to create classroom. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClassroom = async (e) => {
    e.preventDefault();
    
    // Validation for edit form
    if (!editClassroom.seriesNumber || !/^\d{2}$/.test(editClassroom.seriesNumber)) {
      toast.error('Please enter a valid 2-digit series number');
      return;
    }
    
    if (!editClassroom.departmentCode || !/^\d{2}$/.test(editClassroom.departmentCode)) {
      toast.error('Please enter a valid 2-digit department code');
      return;
    }
    
    if (!editClassroom.totalStudents || editClassroom.totalStudents < 1 || editClassroom.totalStudents > 180) {
      toast.error('Please enter total students between 1 and 180');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.put(`/api/classes/${editClassroom.id}`, {
        seriesNumber: editClassroom.seriesNumber.padStart(2, '0'),
        departmentCode: editClassroom.departmentCode.padStart(2, '0'),
        totalStudents: parseInt(editClassroom.totalStudents)
      });

      if (response.data.success) {
        toast.success('Classroom updated successfully! 🎉');
        setShowEditForm(false);
        setEditClassroom({ id: '', seriesNumber: '', departmentCode: '', totalStudents: '' });
        await fetchClassrooms();
      } else {
        toast.error(response.data.message || 'Failed to update classroom');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          'Failed to update classroom. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClassroom = async (classroomId, classroomName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE "${classroomName}"?\n\nThis action cannot be undone and will remove all student data.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/classes/${classroomId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchClassrooms();
      } else {
        toast.error(response.data.message || 'Failed to delete classroom');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete classroom';
      toast.error(errorMessage);
    }
  };

  const handleViewStudents = async (classroomId) => {
    try {
      const response = await axios.get(`/api/classes/${classroomId}`);
      
      if (response.data.success) {
        setSelectedClassroom(response.data.data);
        setShowStudentsModal(true);
      } else {
        toast.error('Failed to load student details');
      }
    } catch (error) {
      toast.error('Failed to load student details');
    }
  };

  const openEditForm = (classroom) => {
    setEditClassroom({
      id: classroom._id,
      seriesNumber: classroom.seriesNumber,
      departmentCode: classroom.departmentCode,
      totalStudents: classroom.totalStudents
    });
    setShowEditForm(true);
  };

const getRollNumberPreview = (series, dept, count) => {

  if (!series || !dept || !count) return '';


  const start = `${series}${dept}001`;

  const end = `${series}${dept}${count.toString().padStart(3, '0')}`;

  return `${start} - ${end}`;

};

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h2>🏫 Manage Classrooms</h2>
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
          <h1>🏫 Classroom Management</h1>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="create-btn"
          >
            ➕ Create New Classroom
          </button>
        </div>

        {/* Create Classroom Modal */}
        {showCreateForm && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateForm(false);
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New Classroom</h3>
                <button onClick={() => setShowCreateForm(false)} className="close-btn">✕</button>
              </div>
              
              <form onSubmit={handleCreateClassroom}>
                <div className="form-group">
                  <label htmlFor="seriesNumber">Series Number (2 digits):</label>
                  <input
                    id="seriesNumber"
                    type="text"
                    maxLength="2"
                    value={newClassroom.seriesNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only digits
                      setNewClassroom({...newClassroom, seriesNumber: value});
                    }}
                    placeholder="e.g., 20, 21, 22"
                    required
                    disabled={submitting}
                    autoFocus
                  />
                  <small className="form-hint">📅 Enter batch year (e.g., 20 for 2020 batch)</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="departmentCode">Department Code (2 digits):</label>
                  <input
                    id="departmentCode"
                    type="text"
                    maxLength="2"
                    value={newClassroom.departmentCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only digits
                      setNewClassroom({...newClassroom, departmentCode: value});
                    }}
                    placeholder="e.g., 15, 16, 17"
                    required
                    disabled={submitting}
                  />
                  <small className="form-hint">🏫 Department codes: 03=CSE, 01=EEE, 02=ME, etc.</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="totalStudents">Total Students (1-180):</label>
                  <input
                    id="totalStudents"
                    type="number"
                    min="1"
                    max="180"
                    value={newClassroom.totalStudents}
                    onChange={(e) => setNewClassroom({...newClassroom, totalStudents: e.target.value})}
                    placeholder="e.g., 45"
                    required
                    disabled={submitting}
                  />
                  {newClassroom.seriesNumber && newClassroom.departmentCode && newClassroom.totalStudents && (
                    <small className="form-hint roll-preview">

  🎓 Roll numbers will be: {getRollNumberPreview(newClassroom.seriesNumber, newClassroom.departmentCode, newClassroom.totalStudents)}

</small>
                  )}
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? '⏳ Creating...' : '✅ Create Classroom'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewClassroom({ seriesNumber: '', departmentCode: '', totalStudents: '' });
                    }}
                    className="cancel-btn"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Classroom Modal */}
        {showEditForm && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditForm(false);
          }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3>Edit Classroom</h3>
                <button onClick={() => setShowEditForm(false)} className="close-btn">✕</button>
              </div>
              
              <form onSubmit={handleEditClassroom}>
                <div className="form-group">
                  <label htmlFor="editSeriesNumber">Series Number (2 digits):</label>
                  <input
                    id="editSeriesNumber"
                    type="text"
                    maxLength="2"
                    value={editClassroom.seriesNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setEditClassroom({...editClassroom, seriesNumber: value});
                    }}
                    required
                    disabled={submitting}
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editDepartmentCode">Department Code (2 digits):</label>
                  <input
                    id="editDepartmentCode"
                    type="text"
                    maxLength="2"
                    value={editClassroom.departmentCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setEditClassroom({...editClassroom, departmentCode: value});
                    }}
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editTotalStudents">Total Students (1-180):</label>
                  <input
                    id="editTotalStudents"
                    type="number"
                    min="1"
                    max="180"
                    value={editClassroom.totalStudents}
                    onChange={(e) => setEditClassroom({...editClassroom, totalStudents: e.target.value})}
                    required
                    disabled={submitting}
                  />
                  <small className="form-hint">⚠️ Changing student count will regenerate all roll numbers</small>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? '⏳ Updating...' : '✅ Update Classroom'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowEditForm(false)}
                    className="cancel-btn"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Students Modal */}
        {showStudentsModal && selectedClassroom && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) setShowStudentsModal(false);
          }}>
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>👥 Students in {selectedClassroom.className}</h3>
                <button onClick={() => setShowStudentsModal(false)} className="close-btn">✕</button>
              </div>
              
              <div className="students-list">
                <div className="students-stats">
                  <div className="stat-item">
                    <span className="stat-label">📊 Total Students:</span>
                    <span className="stat-value">{selectedClassroom.students.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">🏷️ Class Code:</span>
                    <span className="stat-value">{selectedClassroom.classCode}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">📅 Series:</span>
                    <span className="stat-value">{selectedClassroom.seriesNumber}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">🏫 Department:</span>
                    <span className="stat-value">{selectedClassroom.departmentCode}</span>
                  </div>
                </div>
                
                <div className="students-table">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Roll Number</th>
                        <th>Registration Number</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassroom.students.map((student, index) => (
                        <tr key={student._id}>
                          <td>{index + 1}</td>
                          <td className="roll-number">{student.rollNumber}</td>
                          <td className="reg-number">{student.registrationNumber}</td>
                          <td>{student.name}</td>
                          <td>
                            <span className={`status-badge ${student.status}`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classrooms List */}
        <div className="classrooms-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading classrooms...</p>
              <small>If this takes too long, please refresh the page</small>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="empty-state">
              <h3>📚 No Classrooms Yet</h3>
              <p>Create your first classroom to get started!</p>
              <div className="empty-state-hint">
                <p>💡 <strong>How to create:</strong></p>
                <ul>
                  <li>📅 Enter series number (e.g., 20 for 2020 batch)</li>
                  <li>🏫 Enter department code (e.g., 15 for CSE)</li>
                  <li>👥 Set total students (1-180)</li>
                  <li>🎓 Roll numbers will be auto-generated!</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="classrooms-grid">
              {classrooms.map((classroom) => (
                <div key={classroom._id} className="classroom-card">
                  <div className="card-header">
                    <h4>{classroom.className}</h4>
                    <span className="class-code">🏷️ {classroom.classCode}</span>
                  </div>
                  <div className="card-content">
                    <div className="classroom-stats">
                      <div className="stat-item">
                        <span className="stat-label">📅 Series</span>
                        <span className="stat-value">{classroom.seriesNumber}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">🏫 Department</span>
                        <span className="stat-value">{classroom.departmentCode}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">👥 Students</span>
                        <span className="stat-value">{classroom.totalStudents}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">📋 Roll Range</span>
                        <span className="stat-value roll-range">
                          {classroom.seriesNumber}{classroom.departmentCode}001 - {classroom.seriesNumber}{classroom.departmentCode}{classroom.totalStudents.toString().padStart(3, '0')}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">📅 Created</span>
                        <span className="stat-value">{new Date(classroom.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">📊 Status</span>
                        <span className="stat-value status-active">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => openEditForm(classroom)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="action-btn view-btn"
                      onClick={() => handleViewStudents(classroom._id)}
                    >
                      👁️ View Students
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClassroom(classroom._id, classroom.className)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageClassrooms;
