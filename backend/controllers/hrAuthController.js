const jwt = require('jsonwebtoken');
const HrUser = require('../models/HrUser');

exports.signup = async (req, res) => {
  try {
    const { companyName, email, password } = req.body;
    if(!companyName || !email || !password) return res.status(400).json({error:'Missing fields'});
    const exists = await HrUser.findOne({ email });
    if(exists) return res.status(400).json({error:'Email exists'});
    const newUser = await HrUser.create({ companyName, email, password });
    const token = jwt.sign({ id: newUser._id, email: newUser.email, companyName: newUser.companyName, role: 'hr' }, process.env.JWT_SECRET || 'demo-secret');
    res.json({ token, user: { id: newUser._id, companyName: newUser.companyName, email: newUser.email, role: 'hr' } });
  } catch(err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({error:'Missing fields'});
    const found = await HrUser.findOne({ email, password });
    if(!found) return res.status(401).json({error:'Invalid credentials'});
    const token = jwt.sign({ id: found._id, email: found.email, companyName: found.companyName, role: 'hr' }, process.env.JWT_SECRET || 'demo-secret');
    res.json({ token, user: { id: found._id, companyName: found.companyName, email: found.email, role: 'hr' } });
  } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
