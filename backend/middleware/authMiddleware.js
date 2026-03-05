const jwt = require('jsonwebtoken');
const User = require('../models/User');

// General auth middleware - validates JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resume_screener_super_secret_key_2024');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

// Candidate-only middleware
const candidateOnly = (req, res, next) => {
  if (req.user && req.user.role === 'candidate') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Candidates only.' });
};

// HR-only middleware
const hrOnly = (req, res, next) => {
  if (req.user && req.user.role === 'hr') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. HR users only.' });
};

module.exports = { protect, candidateOnly, hrOnly };
