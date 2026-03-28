const jwt = require('jsonwebtoken');
const Candidate = require('../models/Candidate');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const exists = await Candidate.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const newUser = await Candidate.create({ name, email, password });
    const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name, role: 'candidate' }, process.env.JWT_SECRET || 'demo-secret');
    res.json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: 'candidate' } });
  } catch (err) {
    console.error('Candidate signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const found = await Candidate.findOne({ email, password });
    if (!found) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: found._id, email: found.email, name: found.name, role: 'candidate' }, process.env.JWT_SECRET || 'demo-secret');
    res.json({ token, user: { id: found._id, name: found.name, email: found.email, role: 'candidate' } });
  } catch (err) {
    console.error('Candidate login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
