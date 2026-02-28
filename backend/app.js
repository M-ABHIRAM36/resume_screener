const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routers
const hrAuthRoutes = require('./routes/hrAuthRoutes');
const hrJobRoutes = require('./routes/hrJobRoutes');
const hrResumeRoutes = require('./routes/hrResumeRoutes');
const hrDashboardRoutes = require('./routes/hrDashboardRoutes');
const candidateRoutes = require('./routes/candidateRoutes');

app.use('/hr/auth', hrAuthRoutes);
app.use('/hr/jobs', hrJobRoutes);
app.use('/hr/resumes', hrResumeRoutes);
app.use('/hr/dashboard', hrDashboardRoutes);
app.use('/candidate', candidateRoutes);
const hrDebugRoutes = require('./routes/hrDebugRoutes');
app.use('/hr/debug', hrDebugRoutes);

// Placeholder root
app.get('/', (req, res) => res.json({message: 'Resume Screening Backend (HR)'}));

module.exports = app;
