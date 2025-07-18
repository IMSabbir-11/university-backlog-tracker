import React from 'react';
import LoginForm from '../components/Login/LoginForm';

const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="app-title">🎓 AcademiTrack</h1>
          <p className="app-subtitle">University Backlog Management System</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
