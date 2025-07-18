const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');
const resultRoutes = require('./routes/result');
const noticeRoutes = require('./routes/notice');

const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  // origin: process.env.FRONTEND_URL || 'https://university-backlog-tracker-1.onrender.com',
  origin: 'https://university-backlog-tracker-1.onrender.com',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/notices', noticeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AcademiTrack Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AcademiTrack Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});
