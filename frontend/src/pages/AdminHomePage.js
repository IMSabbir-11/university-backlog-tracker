import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminHomePage = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalClassrooms: 0,
    totalStudents: 0,
    publishedResults: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const classroomsResponse = await axios.get('/api/classes', {
          headers: { 'x-auth-token': token }
        });

        if (classroomsResponse.data.success) {
          const classrooms = classroomsResponse.data.data || [];
          const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom.totalStudents, 0);
          
          setDashboardStats({
            totalClassrooms: classrooms.length,
            totalStudents: totalStudents,
            publishedResults: 0 // TODO: Implement when results feature is added
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setDashboardStats({
          totalClassrooms: 0,
          totalStudents: 0,
          publishedResults: 0
        });
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Dashboard loading timeout - stopping');
        setLoading(false);
      }
    }, 5000); 

    fetchDashboardStats();

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); 

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const adminFeatures = [
    {
      id: 'classrooms',
      title: '🏫 Manage Classrooms',
      description: 'Create and manage student classrooms',
      path: '/manage-classrooms',
      color: '#4f46e5'
    },
    {
      id: 'results',
      title: '📊 Publish Results',
      description: 'Publish backlog results for students',
      path: '/publish-results',
      color: '#10b981'
    },
    {
      id: 'notices',
      title: '📢 Send Notices',
      description: 'Send announcements to students',
      path: '/send-notices',
      color: '#f59e0b'
    }
  ];

  return (
    <div className="admin-home">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h2>🎓 AcademiTrack Admin</h2>
        </div>
        <div className="nav-actions">
          <span>Welcome, {user?.email || 'Admin'}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>
      
      <div className="admin-content">
        <div className="dashboard-header">
          <h1>📊 Admin Dashboard</h1>
          <p>Welcome to the AcademiTrack administration panel!</p>
        </div>
        
        <div className="admin-cards">
          {adminFeatures.map((feature) => (
            <div 
              key={feature.id}
              className="admin-card clickable"
              onClick={() => navigate(feature.path)}
              style={{ borderLeftColor: feature.color }}
            >
              <div className="card-header">
                <h3>{feature.title}</h3>
              </div>
              <div className="card-content">
                <p>{feature.description}</p>
              </div>
              <div className="card-footer">
                <span className="card-action">Click to access →</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-stats">
          {loading ? (
            <div className="stats-loading">
              <div className="spinner-small"></div>
              <span>Loading stats...</span>
            </div>
          ) : (
            <>
              <div className="stat-card">
                <h4>📚 Total Classrooms</h4>
                <span className="stat-number">{dashboardStats.totalClassrooms}</span>
              </div>
              <div className="stat-card">
                <h4>👥 Total Students</h4>
                <span className="stat-number">{dashboardStats.totalStudents}</span>
              </div>
              <div className="stat-card">
                <h4>📋 Published Results</h4>
                <span className="stat-number">{dashboardStats.publishedResults}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
