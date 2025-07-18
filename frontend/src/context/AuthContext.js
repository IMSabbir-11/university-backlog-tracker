import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

const AuthContext = createContext();

axios.defaults.baseURL = API_URL || 'https://university-backlog-tracker.onrender.com';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        error: null
      };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAIL':
    case 'AUTH_ERROR':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({ type: 'AUTH_ERROR' });
      return;
    }

    try {
      const timeoutId = setTimeout(() => {
        console.log('⏰ Auth loading timeout - stopping');
        dispatch({ type: 'AUTH_ERROR' });
      }, 10000); // 10 second timeout

      setAuthToken(token);
      
      const userData = {
        id: 'admin-id',
        email: 'admin@academitrack.com',
        role: 'admin'
      };

      clearTimeout(timeoutId);
      dispatch({
        type: 'USER_LOADED',
        payload: userData
      });
    } catch (err) {
      console.error('❌ Auth error:', err);
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  const login = async (formData, userType) => {
    try {
      console.log('🔄 Attempting login:', { formData, userType });
      
      dispatch({ type: 'CLEAR_ERRORS' });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const endpoint = userType === 'admin' ? '/api/auth/admin' : '/api/auth/student';
      
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      };

      const res = await axios.post(endpoint, formData, config);
      
      console.log('✅ Login response:', res.data);

      if (res.data.success) {
        setAuthToken(res.data.token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: res.data
        });

        return res.data;
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMsg = 'Login failed. Please try again.';
      
      if (err.code === 'ECONNABORTED') {
        errorMsg = 'Connection timeout. Please check your internet connection.';
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMsg = 'Network error. Please check if the server is running.';
      } else if (err.response?.status === 401) {
        errorMsg = 'Invalid credentials. Please check your email/password.';
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || 'Invalid data provided.';
      } else if (err.response?.status === 500) {
        errorMsg = 'Server error. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      dispatch({
        type: 'LOGIN_FAIL',
        payload: errorMsg
      });
      
      throw new Error(errorMsg);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    console.log('🚪 User logging out');
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const isAdmin = () => {
    return state.user && state.user.role === 'admin';
  };

  const isStudent = () => {
    return state.user && state.user.role === 'student';
  };

  const getUserDisplayName = () => {
    if (!state.user) return 'User';
    
    if (state.user.role === 'admin') {
      return state.user.email || 'Admin';
    } else if (state.user.role === 'student') {
      return state.user.name || state.user.rollNumber || 'Student';
    }
    
    return 'User';
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadUser();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        dispatch({ type: 'AUTH_ERROR' });
      }
    };

    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && state.isAuthenticated) {
          console.log('🔐 Token expired, logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  const contextValue = {
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    user: state.user,
    error: state.error,
    
    login,
    logout,
    loadUser,
    clearErrors,
    
    isAdmin,
    isStudent,
    getUserDisplayName
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
