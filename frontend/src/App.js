import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NoticeProvider } from './context/NoticeContext';
import LoginPage from './pages/LoginPage';
import AdminHomePage from './pages/AdminHomePage';
import StudentHomePage from './pages/StudentHomePage';
import ManageClassrooms from './pages/ManageClassrooms';
import PublishResults from './pages/PublishResults';
import SendNotices from './pages/SendNotices';
import StudentNotices from './pages/StudentNotices';
import ProtectedRoute from './components/Common/ProtectedRoute';

import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NoticeProvider>
          <Router>
            <div className="App">
              <Routes>
                {}
                <Route path="/" element={<LoginPage />} />
                
                {}
                <Route 
                  path="/admin-dashboard" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminHomePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/manage-classrooms" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ManageClassrooms />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/publish-results" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <PublishResults />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/send-notices" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <SendNotices />
                    </ProtectedRoute>
                  } 
                />
                
                {}
                <Route 
                  path="/student-dashboard" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentHomePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student-notices" 
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentNotices />
                    </ProtectedRoute>
                  } 
                />
                
                {}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                toastStyle={{
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid rgba(0, 255, 157, 0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                progressStyle={{
                  background: 'linear-gradient(90deg, #00ff9d, #00d4ff)'
                }}
              />
            </div>
          </Router>
        </NoticeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
