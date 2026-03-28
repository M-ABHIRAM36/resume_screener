const ScreeningSession = require('../models/ScreeningSession');
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

exports.saveSession = async (req, res) => {
  try {
    const hrUserId = getUserIdFromToken(req);
    if (!hrUserId) return res.status(401).json({ error: 'Not authenticated' });

    const { jobTitle, jobId, jobLocation, requiredSkills, candidates } = req.body;
    if (!jobTitle) return res.status(400).json({ error: 'jobTitle is required' });

    const candidateSummaries = (candidates || []).map(c => ({
      candidateId: c.candidateId || '',
      name: c.name || 'Unknown',
      email: c.email || '',
      phone: c.phone || '',
      score: c.score || 0,
      matchPercentage: c.matchPercentage || 0,
      resumeStrength: c.resumeStrength || '',
      jobFitLevel: c.jobFitLevel || '',
      skills: (c.skills || []).slice(0, 20),
      missingSkills: (c.missingSkills || []).slice(0, 20),
      experience: c.experience || 0,
      college: c.college || '',
      location: c.location || '',
      branch: c.branch || '',
      degree: c.degree || '',
      internships: (c.internships || []).slice(0, 10),
      portfolioLinks: (c.portfolioLinks || []).slice(0, 10)
    }));

    const totalCandidates = candidateSummaries.length;
    const avgScore = totalCandidates > 0
      ? Math.round(candidateSummaries.reduce((s, c) => s + c.score, 0) / totalCandidates)
      : 0;
    const highFitCount = candidateSummaries.filter(c => c.matchPercentage >= 70).length;

    const session = await ScreeningSession.create({
      hrUserId,
      jobTitle,
      jobId: jobId || '',
      jobLocation: jobLocation || '',
      requiredSkills: (requiredSkills || []).slice(0, 30),
      totalCandidates,
      avgScore,
      highFitCount,
      candidates: candidateSummaries
    });

    res.json({ success: true, session });
  } catch (err) {
    console.error('saveSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const hrUserId = getUserIdFromToken(req);
    if (!hrUserId) return res.status(401).json({ error: 'Not authenticated' });

    const { jobTitle, jobId, jobLocation, requiredSkills, candidates } = req.body;

    const candidateSummaries = (candidates || []).map(c => ({
      candidateId: c.candidateId || '',
      name: c.name || 'Unknown',
      email: c.email || '',
      phone: c.phone || '',
      score: c.score || 0,
      matchPercentage: c.matchPercentage || 0,
      resumeStrength: c.resumeStrength || '',
      jobFitLevel: c.jobFitLevel || '',
      skills: (c.skills || []).slice(0, 20),
      missingSkills: (c.missingSkills || []).slice(0, 20),
      experience: c.experience || 0,
      college: c.college || '',
      location: c.location || '',
      branch: c.branch || '',
      degree: c.degree || '',
      internships: (c.internships || []).slice(0, 10),
      portfolioLinks: (c.portfolioLinks || []).slice(0, 10)
    }));

    const totalCandidates = candidateSummaries.length;
    const avgScore = totalCandidates > 0
      ? Math.round(candidateSummaries.reduce((s, c) => s + c.score, 0) / totalCandidates)
      : 0;
    const highFitCount = candidateSummaries.filter(c => c.matchPercentage >= 70).length;

    const session = await ScreeningSession.findOneAndUpdate(
      { _id: req.params.id, hrUserId },
      {
        jobTitle: jobTitle || undefined,
        jobId: jobId || undefined,
        jobLocation: jobLocation || undefined,
        requiredSkills: requiredSkills || undefined,
        totalCandidates,
        avgScore,
        highFitCount,
        candidates: candidateSummaries
      },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ success: true, session });
  } catch (err) {
    console.error('updateSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listSessions = async (req, res) => {
  try {
    const hrUserId = getUserIdFromToken(req);
    if (!hrUserId) return res.status(401).json({ error: 'Not authenticated' });

    const sessions = await ScreeningSession.find({ hrUserId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-candidates')
      .lean();

    res.json(sessions);
  } catch (err) {
    console.error('listSessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const hrUserId = getUserIdFromToken(req);
    if (!hrUserId) return res.status(401).json({ error: 'Not authenticated' });

    const session = await ScreeningSession.findOne({
      _id: req.params.id,
      hrUserId
    }).lean();

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error('getSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const hrUserId = getUserIdFromToken(req);
    if (!hrUserId) return res.status(401).json({ error: 'Not authenticated' });

    const result = await ScreeningSession.deleteOne({
      _id: req.params.id,
      hrUserId
    });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Session not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteSession error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
