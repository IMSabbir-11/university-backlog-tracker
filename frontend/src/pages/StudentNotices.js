import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StudentNotices = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, [token]);

  useEffect(() => {
    if (user?.rollNumber) {
      fetchNotices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notices/student/${user.rollNumber}`);
      
      if (response.data.success) {
        setNotices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notice) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);
    
    // Mark notice as seen
    const isUnseen = !notice.seenBy.some(seen => seen.studentRollNumber === user.rollNumber);
    if (isUnseen) {
      try {
        await axios.post(`/api/notices/${notice._id}/seen`, {
          studentRollNumber: user.rollNumber
        });
        
        // Update local state
        setNotices(notices.map(n => 
          n._id === notice._id 
            ? {
                ...n, 
                seenBy: [...n.seenBy, { studentRollNumber: user.rollNumber, seenAt: new Date() }]
              }
            : n
        ));
      } catch (error) {
        console.error('Error marking notice as seen:', error);
      }
    }
  };

  const isNoticeSeen = (notice) => {
    return notice.seenBy.some(seen => seen.studentRollNumber === user.rollNumber);
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

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="student-home neon-theme">
      <nav className="student-nav neon-nav">
        <div className="nav-brand">
          <h2 className="neon-text">📢 Notices</h2>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/student-dashboard')} className="back-btn">
            ← Back to Dashboard
          </button>
          <span className="welcome-text">Welcome, {user?.name || user?.rollNumber}</span>
          <button onClick={handleLogout} className="logout-btn neon-btn">
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="student-content">
        <div className="page-header">
          <h1 className="main-title">📢 Notice Board</h1>
          <p className="subtitle">Stay updated with important announcements</p>
        </div>

        {loading ? (
          <div className="loading-state neon-loading">
            <div className="neon-spinner"></div>
            <p>Loading notices...</p>
          </div>
        ) : notices.length === 0 ? (
          <div className="empty-state neon-empty">
            <div className="empty-icon">📋</div>
            <h4>No Notices Available</h4>
            <p>There are no notices published for your classroom yet.</p>
          </div>
        ) : (
          <div className="notices-list">
            {notices.map((notice) => (
              <div 
                key={notice._id}
                className={`notice-item ${!isNoticeSeen(notice) ? 'unseen' : 'seen'}`}
                onClick={() => handleNoticeClick(notice)}
              >
                <div className="notice-indicator">
                  {!isNoticeSeen(notice) && <div className="unseen-dot"></div>}
                </div>
                
                <div className="notice-priority">
                  <span 
                    className="priority-badge"
                    style={{ 
                      backgroundColor: getPriorityColor(notice.priority),
                      color: '#ffffff'
                    }}
                  >
                    {getPriorityIcon(notice.priority)}
                  </span>
                </div>
                
                <div className="notice-content">
                  <h3 className="notice-subject">{notice.subject}</h3>
                  <p className="notice-preview">
                    {notice.description.substring(0, 100)}
                    {notice.description.length > 100 ? '...' : ''}
                  </p>
                  <div className="notice-meta">
                    <span className="notice-date">
                      📅 {new Date(notice.publishedAt).toLocaleDateString()}
                    </span>
                    <span className="notice-time">
                      🕒 {new Date(notice.publishedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="notice-arrow">
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notice Modal */}
        {showNoticeModal && selectedNotice && (
          <div className="modal-overlay translucent-overlay">
            <div className="modal-content notice-modal">
              <div className="modal-header">
                <div className="notice-priority-header">
                  <span 
                    className="priority-badge large"
                    style={{ 
                      backgroundColor: getPriorityColor(selectedNotice.priority),
                      color: '#ffffff'
                    }}
                  >
                    {getPriorityIcon(selectedNotice.priority)} {selectedNotice.priority.toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={() => setShowNoticeModal(false)} 
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              
              <div className="notice-modal-content">
                <h2 className="notice-title">{selectedNotice.subject}</h2>
                
                <div className="notice-details">
                  <div className="detail-item">
                    <span className="detail-label">📅 Published:</span>
                    <span className="detail-value">
                      {new Date(selectedNotice.publishedAt).toLocaleDateString()} at {new Date(selectedNotice.publishedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {selectedNotice.lastModified !== selectedNotice.publishedAt && (
                    <div className="detail-item">
                      <span className="detail-label">✏️ Last Modified:</span>
                      <span className="detail-value">
                        {new Date(selectedNotice.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="notice-description">
                  <h4>📋 Description:</h4>
                  <div className="description-content">
                    {selectedNotice.description.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotices;
