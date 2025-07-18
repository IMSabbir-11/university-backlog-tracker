import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SendNotices = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [noticeForm, setNoticeForm] = useState({
    subject: '',
    description: '',
    targetType: 'specific',
    targetClassrooms: [],
    priority: 'medium'
  });
  
  const [editNotice, setEditNotice] = useState({
    id: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, [token]);

  useEffect(() => {
    fetchClassrooms();
    fetchNotices();
  }, [token]);

  const fetchClassrooms = async () => {
    try {
      const response = await axios.get('/api/notices/classrooms');
      if (response.data.success) {
        setClassrooms(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('Failed to load classrooms');
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notices');
      if (response.data.success) {
        setNotices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    
    if (!noticeForm.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    
    if (!noticeForm.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (noticeForm.targetType === 'specific' && noticeForm.targetClassrooms.length === 0) {
      toast.error('Please select at least one classroom');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post('/api/notices', noticeForm);

      if (response.data.success) {
        toast.success(response.data.message);
        setShowCreateForm(false);
        setNoticeForm({
          subject: '',
          description: '',
          targetType: 'specific',
          targetClassrooms: [],
          priority: 'medium'
        });
        await fetchNotices();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create notice';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNotice = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.put(`/api/notices/${editNotice.id}`, {
        subject: editNotice.subject,
        description: editNotice.description,
        priority: editNotice.priority
      });

      if (response.data.success) {
        toast.success('Notice updated successfully');
        setShowEditForm(false);
        setEditNotice({ id: '', subject: '', description: '', priority: 'medium' });
        await fetchNotices();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update notice';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (noticeId, subject) => {
    if (!window.confirm(`Are you sure you want to delete the notice "${subject}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/notices/${noticeId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchNotices();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete notice';
      toast.error(errorMessage);
    }
  };

  const openEditForm = (notice) => {
    setEditNotice({
      id: notice._id,
      subject: notice.subject,
      description: notice.description,
      priority: notice.priority
    });
    setShowEditForm(true);
  };

  const handleClassroomSelection = (classroomId) => {
    if (noticeForm.targetClassrooms.includes(classroomId)) {
      setNoticeForm({
        ...noticeForm,
        targetClassrooms: noticeForm.targetClassrooms.filter(id => id !== classroomId)
      });
    } else {
      setNoticeForm({
        ...noticeForm,
        targetClassrooms: [...noticeForm.targetClassrooms, classroomId]
      });
    }
  };

  const selectAllClassrooms = () => {
    setNoticeForm({
      ...noticeForm,
      targetClassrooms: classrooms.map(classroom => classroom._id)
    });
  };

  const clearClassroomSelection = () => {
    setNoticeForm({
      ...noticeForm,
      targetClassrooms: []
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff1493';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffaa00';
      case 'low': return '#00d4ff';
      default: return '#00d4ff';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📢';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div className="admin-page">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h2>📢 Send Notices</h2>
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
          <h1>📢 Notice Management</h1>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="create-btn"
          >
            ➕ Create New Notice
          </button>
        </div>

        {/* Create Notice Modal */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal-content large-modal">
              <div className="modal-header">
                <h3>📝 Create New Notice</h3>
                <button onClick={() => setShowCreateForm(false)} className="close-btn">✕</button>
              </div>

              <form onSubmit={handleCreateNotice} className="notice-form">
                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input
                    id="subject"
                    type="text"
                    value={noticeForm.subject}
                    onChange={(e) => setNoticeForm({...noticeForm, subject: e.target.value})}
                    placeholder="Enter notice subject"
                    className="form-input"
                    maxLength="200"
                    required
                    disabled={submitting}
                  />
                  <small className="form-hint">{noticeForm.subject.length}/200 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    value={noticeForm.description}
                    onChange={(e) => setNoticeForm({...noticeForm, description: e.target.value})}
                    placeholder="Enter detailed notice description"
                    className="form-textarea"
                    rows="6"
                    maxLength="2000"
                    required
                    disabled={submitting}
                  />
                  <small className="form-hint">{noticeForm.description.length}/2000 characters</small>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority:</label>
                  <select
                    id="priority"
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({...noticeForm, priority: e.target.value})}
                    className="form-input"
                    disabled={submitting}
                  >
                    <option value="low">ℹ️ Low</option>
                    <option value="medium">📢 Medium</option>
                    <option value="high">⚠️ High</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Classrooms:</label>
                  <div className="target-type-selector">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="targetType"
                        value="specific"
                        checked={noticeForm.targetType === 'specific'}
                        onChange={(e) => setNoticeForm({...noticeForm, targetType: e.target.value})}
                        disabled={submitting}
                      />
                      <span>Specific Classrooms</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="targetType"
                        value="all"
                        checked={noticeForm.targetType === 'all'}
                        onChange={(e) => setNoticeForm({...noticeForm, targetType: e.target.value})}
                        disabled={submitting}
                      />
                      <span>All Classrooms</span>
                    </label>
                  </div>
                </div>

                {noticeForm.targetType === 'specific' && (
                  <div className="form-group">
                    <div className="classroom-selection-header">
                      <label>Select Classrooms:</label>
                      <div className="selection-actions">
                        <button type="button" onClick={selectAllClassrooms} className="select-all-btn">
                          Select All
                        </button>
                        <button type="button" onClick={clearClassroomSelection} className="clear-btn">
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="classroom-grid">
                      {classrooms.map((classroom) => (
                        <div 
                          key={classroom._id}
                          className={`classroom-option ${noticeForm.targetClassrooms.includes(classroom._id) ? 'selected' : ''}`}
                          onClick={() => handleClassroomSelection(classroom._id)}
                        >
                          <div className="classroom-info">
                            <h4>{classroom.className}</h4>
                            <span className="class-code">{classroom.classCode}</span>
                            <span className="student-count">{classroom.totalStudents} students</span>
                          </div>
                          <div className="selection-indicator">
                            {noticeForm.targetClassrooms.includes(classroom._id) ? '✅' : '⭕'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <small className="form-hint">
                      {noticeForm.targetClassrooms.length} classroom(s) selected
                    </small>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? '⏳ Publishing...' : '📢 Publish Notice'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
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

        {/* Edit Notice Modal */}
        {showEditForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>✏️ Edit Notice</h3>
                <button onClick={() => setShowEditForm(false)} className="close-btn">✕</button>
              </div>

              <form onSubmit={handleEditNotice} className="notice-form">
                <div className="form-group">
                  <label htmlFor="editSubject">Subject:</label>
                  <input
                    id="editSubject"
                    type="text"
                    value={editNotice.subject}
                    onChange={(e) => setEditNotice({...editNotice, subject: e.target.value})}
                    className="form-input"
                    maxLength="200"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editDescription">Description:</label>
                  <textarea
                    id="editDescription"
                    value={editNotice.description}
                    onChange={(e) => setEditNotice({...editNotice, description: e.target.value})}
                    className="form-textarea"
                    rows="6"
                    maxLength="2000"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editPriority">Priority:</label>
                  <select
                    id="editPriority"
                    value={editNotice.priority}
                    onChange={(e) => setEditNotice({...editNotice, priority: e.target.value})}
                    className="form-input"
                    disabled={submitting}
                  >
                    <option value="low">ℹ️ Low</option>
                    <option value="medium">📢 Medium</option>
                    <option value="high">⚠️ High</option>
                    <option value="urgent">🚨 Urgent</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? '⏳ Updating...' : '✅ Update Notice'}
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

        {/* Notices List */}
        <div className="notices-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="empty-state">
              <h3>📢 No Notices Yet</h3>
              <p>Create your first notice to communicate with students!</p>
            </div>
          ) : (
            <div className="notices-grid">
              {notices.map((notice) => (
                <div key={notice._id} className="notice-card">
                  <div className="notice-header">
                    <div className="notice-priority">
                      <span 
                        className="priority-badge"
                        style={{ 
                          backgroundColor: getPriorityColor(notice.priority),
                          color: '#ffffff'
                        }}
                      >
                        {getPriorityIcon(notice.priority)} {notice.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="notice-date">
                      {new Date(notice.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="notice-content">
                    <h4>{notice.subject}</h4>
                    <p>{notice.description.substring(0, 150)}{notice.description.length > 150 ? '...' : ''}</p>
                  </div>
                  
                  <div className="notice-footer">
                    <div className="target-info">
                      <span className="target-type">
                        {notice.targetType === 'all' ? '🌐 All Classrooms' : `🎯 ${notice.targetClassrooms.length} Classroom(s)`}
                      </span>
                      <span className="seen-count">
                        👁️ {notice.seenBy.length} seen
                      </span>
                    </div>
                    
                    <div className="notice-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => openEditForm(notice)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteNotice(notice._id, notice.subject)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
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

export default SendNotices;
