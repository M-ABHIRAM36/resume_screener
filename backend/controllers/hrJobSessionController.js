const JobSession = require('../models/JobSession');
const SessionResult = require('../models/SessionResult');
const Job = require('../models/Job');
const jwt = require('jsonwebtoken');

function getUserIdFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const token = auth.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
    return decoded.id;
  } catch { return null; }
}

// POST /api/hr/session/create
exports.createSession = async (req, res) => {
  try {
    const hrId = getUserIdFromToken(req);
    if (!hrId) return res.status(401).json({ error: 'Not authenticated' });

    const { title, jobRole, college, batch, description } = req.body;
    if (!title || !jobRole) {
      return res.status(400).json({ error: 'title and jobRole are required' });
    }

    const session = await JobSession.create({
      hrId,
      title: title.trim(),
      jobRole: jobRole.trim(),
      college: (college || '').trim(),
      batch: (batch || '').trim(),
      description: (description || '').trim()
    });

    res.json({ success: true, session });
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/hr/session/list
exports.listSessions = async (req, res) => {
  try {
    const hrId = getUserIdFromToken(req);
    if (!hrId) return res.status(401).json({ error: 'Not authenticated' });

    const sessions = await JobSession.find({ hrId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Attach candidate count for each session
    const sessionIds = sessions.map(s => s._id);
    const counts = await SessionResult.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      { $group: { _id: '$sessionId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const enriched = sessions.map(s => ({
      ...s,
      candidateCount: countMap[s._id.toString()] || 0
    }));

    res.json(enriched);
  } catch (err) {
    console.error('listSessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/hr/session/:id
exports.getSession = async (req, res) => {
  try {
    const hrId = getUserIdFromToken(req);
    if (!hrId) return res.status(401).json({ error: 'Not authenticated' });

    const session = await JobSession.findOne({ _id: req.params.id, hrId }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const candidates = await SessionResult.find({ sessionId: session._id })
      .sort({ score: -1 })
      .lean();

    res.json({ ...session, candidates });
  } catch (err) {
    console.error('getSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/hr/session/:id/upload
exports.uploadToSession = async (req, res) => {
  try {
    const hrId = getUserIdFromToken(req);
    if (!hrId) return res.status(401).json({ error: 'Not authenticated' });

    const session = await JobSession.findOne({ _id: req.params.id, hrId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No resume files uploaded' });
    }

    // Build job object from session data for ML service
    const job = {
      id: `session_${session._id}`,
      name: session.jobRole,
      requiredSkills: [],
      description: session.description || '',
      location: ''
    };

    // Try to find matching job for required skills
    const jobDoc = await Job.findOne({
      name: { $regex: new RegExp(session.jobRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    }).lean();
    if (jobDoc) {
      job.requiredSkills = jobDoc.requiredSkills || [];
      job.location = jobDoc.location || '';
    }

    // Call ML service
    let analyzed = [];
    try {
      const ml = require('../services/mlService');
      analyzed = await ml.analyze(job, files, req.body.nameMethod || 'filename');
      console.log('Session upload: ML returned', analyzed?.length || 0, 'candidates');
    } catch (e) {
      console.error('Session upload ML error:', e);
      return res.status(500).json({ error: 'ML service error: ' + (e.message || String(e)) });
    }

    // Save results to sessionResults collection
    const results = [];
    for (const c of analyzed) {
      const result = await SessionResult.create({
        sessionId: session._id,
        candidateName: c.name || 'Unknown',
        email: c.email || '',
        score: c.score || 0,
        matchPercentage: c.matchPercentage || 0,
        skills: (c.skills || []).slice(0, 30),
        missingSkills: (c.missingSkills || []).slice(0, 20)
      });
      results.push(result);
    }

    res.json({
      success: true,
      uploaded: files.length,
      analyzed: results.length,
      candidates: results
    });
  } catch (err) {
    console.error('uploadToSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/hr/session/:id
exports.deleteSession = async (req, res) => {
  try {
    const hrId = getUserIdFromToken(req);
    if (!hrId) return res.status(401).json({ error: 'Not authenticated' });

    const session = await JobSession.findOneAndDelete({ _id: req.params.id, hrId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Also delete all associated results
    await SessionResult.deleteMany({ sessionId: req.params.id });

    res.json({ success: true });
  } catch (err) {
    console.error('deleteSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
