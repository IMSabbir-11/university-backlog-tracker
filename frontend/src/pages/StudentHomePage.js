import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotice } from '../context/NoticeContext';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentHomePage = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const { 
    noticeCount, 
    hasNewNotices, 
    dismissNewNoticesBanner, 
    requestNotificationPermission 
  } = useNotice();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
  }, [token]);

  useEffect(() => {
    if (user?.rollNumber) {
      fetchStudentResults();
      requestNotificationPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/results/student/${user.rollNumber}`);
      
      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching student results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getChartData = () => {
    if (!results || results.totalCourses === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(55, 65, 81, 0.3)'],
          borderColor: ['#374151'],
          borderWidth: 0
        }]
      };
    }

    return {
      labels: ['Passed Courses', 'Failed Courses'],
      datasets: [{
        data: [results.passedCourses, results.failedCourses],
        backgroundColor: [
          'rgba(0, 255, 157, 0.8)',
          'rgba(255, 20, 147, 0.8)'
        ],
        borderColor: [
          '#00ff9d',
          '#ff1493'
        ],
        borderWidth: 3,
        hoverBorderWidth: 5,
        cutout: '75%',
        spacing: 2
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#00ff9d',
        bodyColor: '#ffffff',
        borderColor: '#00ff9d',
        borderWidth: 2,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} courses (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2500,
      easing: 'easeInOutQuart'
    },
    elements: {
      arc: {
        borderRadius: 8
      }
    }
  };

  const getCompletionPercentage = () => {
    if (!results || results.totalCourses === 0) return 0;
    return Math.round((results.passedCourses / results.totalCourses) * 100);
  };

  const getGradeStatus = () => {
    const percentage = getCompletionPercentage();
    if (percentage >= 90) return { text: 'Excellent', color: '#00ff9d', glow: '0 0 20px #00ff9d' };
    if (percentage >= 75) return { text: 'Good', color: '#00d4ff', glow: '0 0 20px #00d4ff' };
    if (percentage >= 60) return { text: 'Average', color: '#ffaa00', glow: '0 0 20px #ffaa00' };
    return { text: 'Needs Improvement', color: '#ff1493', glow: '0 0 20px #ff1493' };
  };

  return (
    <div className="student-home neon-theme">
      {/* Animated Background Particles */}
      <div className="particles-background">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i % 4}`}></div>
        ))}
      </div>

      <nav className="student-nav neon-nav">
        <div className="nav-brand">
          <h2 className="neon-text">🎓 AcademiTrack</h2>
        </div>
        <div className="nav-actions">
          <button 
            onClick={() => navigate('/student-notices')}
            className="notice-btn"
          >
            📢 Notices
            {noticeCount > 0 && (
              <span className="notice-badge">{noticeCount}</span>
            )}
          </button>
          <span className="welcome-text">Welcome, {user?.name || user?.rollNumber}</span>
          <button onClick={handleLogout} className="logout-btn neon-btn">
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* New Notice Banner */}
      {hasNewNotices && (
        <div className="notice-banner">
          <div className="banner-content">
            <div className="banner-icon">📢</div>
            <div className="banner-text">
              <h4>You have {noticeCount} new notice{noticeCount > 1 ? 's' : ''}!</h4>
              <p>Click to view important announcements from administration.</p>
            </div>
            <button 
              onClick={() => navigate('/student-notices')}
              className="banner-btn"
            >
              View Notices
            </button>
            <button 
              onClick={dismissNewNoticesBanner}
              className="banner-close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="student-content">
        <div className="student-header">
          <h1 className="main-title neon-glow">📚 Student Dashboard</h1>
          <p className="subtitle">Track your academic journey with style!</p>
        </div>

        {/* Enhanced Student Info Card */}
        <div className="student-info-card neon-card">
          <div className="card-glow"></div>
          <h3 className="card-title">👨‍🎓 Student Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">📋 Name</span>
              <span className="info-value neon-text">{user?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🎫 Roll Number</span>
              <span className="info-value neon-text">{user?.rollNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📄 Registration</span>
              <span className="info-value neon-text">{user?.registrationNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🏫 Classroom</span>
              <span className="info-value neon-text">{user?.classroom?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🏷️ Class Code</span>
              <span className="info-value neon-text">{user?.classroom?.classCode}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📊 Status</span>
              <span className={`status-badge neon-badge ${user?.status}`}>
                {user?.status || 'enrolled'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-chart-card neon-card">
            <div className="card-glow"></div>
            <h3 className="card-title">📊 Academic Progress</h3>
            {loading ? (
              <div className="loading-state neon-loading">
                <div className="neon-spinner"></div>
                <p>Loading your amazing results...</p>
              </div>
            ) : (
              <div className="chart-container">
                <div className="chart-section">
                  <div className="chart-wrapper">
                    <Doughnut data={getChartData()} options={chartOptions} />
                    <div className="chart-center">
                      <div className={`center-content ${animationComplete ? 'animate-in' : ''}`}>
                        <span 
                          className="completion-percentage neon-number"
                          style={{ 
                            color: getGradeStatus().color,
                            textShadow: getGradeStatus().glow 
                          }}
                        >
                          {getCompletionPercentage()}%
                        </span>
                        <span 
                          className="grade-status"
                          style={{ 
                            color: getGradeStatus().color,
                            textShadow: getGradeStatus().glow 
                          }}
                        >
                          {getGradeStatus().text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="stats-section">
                  <div className="progress-stats">
                    <div className="stat-item total-courses">
                      <div className="stat-icon">📚</div>
                      <span className="stat-value neon-number">{results?.totalCourses || 0}</span>
                      <span className="stat-label">Total Courses</span>
                      <div className="stat-glow"></div>
                    </div>
                    <div className="stat-item passed-courses">
                      <div className="stat-icon">✅</div>
                      <span className="stat-value neon-number passed">{results?.passedCourses || 0}</span>
                      <span className="stat-label">Passed</span>
                      <div className="stat-glow passed-glow"></div>
                    </div>
                    <div className="stat-item failed-courses">
                      <div className="stat-icon">❌</div>
                      <span className="stat-value neon-number failed">{results?.failedCourses || 0}</span>
                      <span className="stat-label">Backlogs</span>
                      <div className="stat-glow failed-glow"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course Results Table */}
        <div className="courses-section">
          <div className="courses-card neon-card">
            <div className="card-glow"></div>
            <h3 className="card-title">📚 Course Results</h3>
            {loading ? (
              <div className="loading-state neon-loading">
                <div className="neon-spinner"></div>
                <p>Loading course results...</p>
              </div>
            ) : results && results.courses && results.courses.length > 0 ? (
              <div className="courses-table neon-table">
                <table>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Semester</th>
                      <th>Status</th>
                      <th>Published Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.courses.map((course, index) => (
                      <tr key={course._id || index} className="course-row">
                        <td className="course-code neon-text">{course.courseCode}</td>
                        <td>{course.courseName}</td>
                        <td>{course.semester}</td>
                        <td>
                          <span className={`status-badge neon-badge ${course.status}`}>
                            {course.status === 'passed' ? '✅ Passed' : '❌ Failed'}
                          </span>
                        </td>
                        <td>{new Date(course.publishedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state neon-empty">
                <div className="empty-icon">📋</div>
                <h4>No Results Published Yet</h4>
                <p>Your course results will appear here once published by administration.</p>
                <div className="empty-glow"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHomePage;
