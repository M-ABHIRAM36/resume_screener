const JobSession = require('../models/JobSession');
const SessionResult = require('../models/SessionResult');

// Create a new job session
exports.createSession = async (req, res) => {
  try {
    const { jobRole, jobDescription, jobLocation, requiredSkills } = req.body;

    if (!jobRole) {
      return res.status(400).json({ error: 'Job role is required' });
    }

    const session = await JobSession.create({
      hrId: req.user._id,
      jobRole,
      jobDescription: jobDescription || '',
      jobLocation: jobLocation || '',
      requiredSkills: requiredSkills || []
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

// Get all sessions for current HR user
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await JobSession.find({ hrId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get single session with its results
exports.getSession = async (req, res) => {
  try {
    const session = await JobSession.findOne({
      _id: req.params.id,
      hrId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const results = await SessionResult.find({ sessionId: session._id })
      .sort({ score: -1 });

    res.json({ session, results });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// Save results to a session (after ML analysis)
exports.saveSessionResults = async (req, res) => {
  try {
    const { sessionId, candidates } = req.body;

    if (!sessionId || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ error: 'sessionId and candidates array required' });
    }

    const session = await JobSession.findOne({
      _id: sessionId,
      hrId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Save each candidate result
    const results = await Promise.all(
      candidates.map(c => SessionResult.create({
        sessionId: session._id,
        hrId: req.user._id,
        candidateName: c.name || 'Unknown',
        candidateEmail: c.email || '',
        score: c.score || 0,
        matchPercentage: c.matchPercentage || 0,
        skills: c.skills || [],
        matchedSkills: c.matchedSkills || [],
        experience: c.experience || 0,
        location: c.location || '',
        college: c.college || '',
        phone: c.phone || '',
        branch: c.branch || c.degree || '',
        resumeFile: c.resumeFile || '',
        rawData: c
      }))
    );

    // Update session stats
    const allResults = await SessionResult.find({ sessionId: session._id });
    session.totalCandidates = allResults.length;
    session.avgScore = allResults.length > 0
      ? Math.round(allResults.reduce((s, r) => s + r.score, 0) / allResults.length)
      : 0;
    session.updatedAt = Date.now();
    await session.save();

    res.status(201).json({ session, results });
  } catch (error) {
    console.error('Save results error:', error);
    res.status(500).json({ error: 'Failed to save results' });
  }
};

// Update session status
exports.updateSession = async (req, res) => {
  try {
    const { status } = req.body;
    const session = await JobSession.findOneAndUpdate(
      { _id: req.params.id, hrId: req.user._id },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

// Delete session and its results
exports.deleteSession = async (req, res) => {
  try {
    const session = await JobSession.findOneAndDelete({
      _id: req.params.id,
      hrId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await SessionResult.deleteMany({ sessionId: session._id });

    res.json({ message: 'Session and results deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

// Get HR stats
exports.getHrStats = async (req, res) => {
  try {
    const sessions = await JobSession.find({ hrId: req.user._id });
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const totalCandidates = sessions.reduce((sum, s) => sum + (s.totalCandidates || 0), 0);
    const avgScore = totalCandidates > 0
      ? Math.round(sessions.reduce((sum, s) => sum + ((s.avgScore || 0) * (s.totalCandidates || 0)), 0) / totalCandidates)
      : 0;

    res.json({
      totalSessions,
      activeSessions,
      totalCandidates,
      avgScore
    });
  } catch (error) {
    console.error('Get HR stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
