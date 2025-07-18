import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [studentData, setStudentData] = useState({
    rollNumber: '',
    registrationNumber: ''
  });
  
  const [adminData, setAdminData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState({
    student: false,
    admin: false
  });

  //Student Login Handler
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    
    console.log('🔄 Student login attempt:', studentData);
    
    if (!studentData.rollNumber || studentData.rollNumber.length !== 7) {
      toast.error('Roll number must be exactly 7 digits (e.g., 2015001)');
      return;
    }
    
    if (!studentData.registrationNumber || !studentData.registrationNumber.startsWith('REG')) {
      toast.error('Registration number must start with "REG" followed by roll number');
      return;
    }
    
    const expectedReg = `REG${studentData.rollNumber}`;
    if (studentData.registrationNumber !== expectedReg) {
      toast.error(`Registration should be ${expectedReg} for roll number ${studentData.rollNumber}`);
      return;
    }

    // ACTUAL LOGIN LOGIC
    setLoading(prev => ({ ...prev, student: true }));
    
    try {
      console.log('📤 Calling login function...');
      const result = await login(studentData, 'student');
      console.log('✅ Login successful:', result);
      toast.success(`Welcome back, ${result.user.name || result.user.rollNumber}! 🎓`);
      navigate('/student-dashboard');
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      if (error.message.includes('not found')) {
        toast.error('Student not found. Please check your credentials or contact admin.');
      } else if (error.message.includes('combination')) {
        toast.error('Roll number and registration number do not match.');
      } else if (error.message.includes('Network Error')) {
        toast.error('Connection error. Please check if the server is running.');
      } else {
        toast.error(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, student: false }));
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminData.email || !adminData.password) {
      toast.error('Please fill in all admin fields');
      return;
    }

    setLoading(prev => ({ ...prev, admin: true }));
    
    try {
      await login(adminData, 'admin');
      toast.success('Welcome back, admin!');
      navigate('/admin-dashboard');
    } catch (error) {
      toast.error(error.message || 'Admin login failed');
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  };

  return (
    <div className="dual-login-form">
      {/* Student Login Form */}
      <div className="login-section student-section">
        <div className="section-header">
          <h2>👨‍🎓 Student Login</h2>
        </div>
        
        <form onSubmit={handleStudentLogin} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Roll Number (7 digits)"
              value={studentData.rollNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 7);
                setStudentData({...studentData, rollNumber: value});
              }}
              className="form-input"
              maxLength="7"
            />
          </div>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Registration Number (REG + Roll)"
              value={studentData.registrationNumber}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setStudentData({...studentData, registrationNumber: value});
              }}
              className="form-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn student-btn"
            disabled={loading.student}
          >
            {loading.student ? 'Logging in...' : 'Student Login'}
          </button>
        </form>
      </div>

      {/* Admin Login Form */}
      <div className="login-section admin-section">
        <div className="section-header">
          <h2>👨‍💼 Admin Login</h2>
        </div>
        
        <form onSubmit={handleAdminLogin} className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={adminData.email}
              onChange={(e) => setAdminData({...adminData, email: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={adminData.password}
              onChange={(e) => setAdminData({...adminData, password: e.target.value})}
              className="form-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn admin-btn"
            disabled={loading.admin}
          >
            {loading.admin ? 'Logging in...' : 'Admin Login'}
          </button>
          
          <button type="button" className="reset-password-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
