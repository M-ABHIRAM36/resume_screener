require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── New Auth & Protected Routes ───
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/hr', sessionRoutes);

// ─── Existing HR routes (kept as-is) ───
const hrAuthRoutes = require('./routes/hrAuthRoutes');
const hrJobRoutes = require('./routes/hrJobRoutes');
const hrResumeRoutes = require('./routes/hrResumeRoutes');
const hrDashboardRoutes = require('./routes/hrDashboardRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const candidateAuthRoutes = require('./routes/candidateAuthRoutes');

app.use('/hr/auth', hrAuthRoutes);
app.use('/hr/jobs', hrJobRoutes);
app.use('/hr/resumes', hrResumeRoutes);
app.use('/hr/dashboard', hrDashboardRoutes);
app.use('/candidate', candidateRoutes);
app.use('/candidate/auth', candidateAuthRoutes);
const hrDebugRoutes = require('./routes/hrDebugRoutes');
app.use('/hr/debug', hrDebugRoutes);

// Placeholder root
app.get('/', (req, res) => res.json({ message: 'Resume Screening Backend API' }));

module.exports = app;
