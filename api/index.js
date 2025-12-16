const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Import modules
const emailService = require('../backend/emailService');
const documentGenerator = require('../backend/documentGenerator');
const Submission = require('../backend/models/Submission');

// Import routes and middleware
const authRoutes = require('../backend/routes/auth');
const { authenticateToken, requireAdmin, requireIntern } = require('../backend/middleware/auth');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/document-generator')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ 
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
    });
});

// Export for Vercel
module.exports = app;
