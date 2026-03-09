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

    const { title, jobRole, college, batch, description, requiredSkills, jobLocation } = req.body;
    if (!title || !jobRole) {
      return res.status(400).json({ error: 'title and jobRole are required' });
    }

    const session = await JobSession.create({
      hrId,
      title: title.trim(),
      jobRole: jobRole.trim(),
      college: (college || '').trim(),
      batch: (batch || '').trim(),
      description: (description || '').trim(),
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      jobLocation: (jobLocation || '').trim()
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

    // Attach candidate count + stats for each session
    const sessionIds = sessions.map(s => s._id);
    const statsAgg = await SessionResult.aggregate([
      { $match: { sessionId: { $in: sessionIds } } },
      { $group: {
        _id: '$sessionId',
        count: { $sum: 1 },
        avgScore: { $avg: '$score' },
        avgMatch: { $avg: '$matchPercentage' },
        maxScore: { $max: '$score' },
        strongCount: { $sum: { $cond: [{ $eq: ['$resumeStrength', 'Strong'] }, 1, 0] } },
        highFitCount: { $sum: { $cond: [{ $eq: ['$jobFitLevel', 'High'] }, 1, 0] } }
      }}
    ]);
    const statsMap = {};
    statsAgg.forEach(s => { statsMap[s._id.toString()] = s; });

    const enriched = sessions.map(s => {
      const st = statsMap[s._id.toString()] || {};
      return {
        ...s,
        candidateCount: st.count || 0,
        avgScore: Math.round(st.avgScore || 0),
        avgMatch: Math.round(st.avgMatch || 0),
        maxScore: st.maxScore || 0,
        strongCount: st.strongCount || 0,
        highFitCount: st.highFitCount || 0
      };
    });

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

    // Map candidates to match master dashboard format
    const mapped = candidates.map(c => ({
      ...c,
      name: c.candidateName,
      id: c._id
    }));

    res.json({ ...session, candidates: mapped });
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
      requiredSkills: session.requiredSkills || [],
      description: session.description || '',
      location: session.jobLocation || ''
    };

    // Try to find matching job for required skills if session doesn't have them
    if (!job.requiredSkills.length) {
      const jobDoc = await Job.findOne({
        name: { $regex: new RegExp(session.jobRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      }).lean();
      if (jobDoc) {
        job.requiredSkills = jobDoc.requiredSkills || [];
        if (!job.location) job.location = jobDoc.location || '';
      }
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

    // Save results with ALL fields to sessionResults collection
    const results = [];
    for (const c of analyzed) {
      const result = await SessionResult.create({
        sessionId: session._id,
        candidateName: c.name || 'Unknown',
        email: c.email || '',
        phone: c.phone || '',
        location: c.location || '',
        college: c.college || '',
        branch: c.branch || c.degree || '',
        experience: c.experience || 0,
        score: c.score || 0,
        matchPercentage: c.matchPercentage || 0,
        skills: (c.skills || []).slice(0, 50),
        missingSkills: (c.missingSkills || []).slice(0, 30),
        matchedSkills: (c.matchedSkills || []).slice(0, 50),
        resumeStrength: c.resumeStrength || '',
        jobFitLevel: c.jobFitLevel || '',
        categoryScores: c.categoryScores || null,
        bonusFactors: c.bonusFactors || null,
        internships: (c.internships || []).slice(0, 20),
        portfolioLinks: (c.portfolioLinks || []).slice(0, 10)
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

    await SessionResult.deleteMany({ sessionId: req.params.id });

    res.json({ success: true });
  } catch (err) {
    console.error('deleteSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
