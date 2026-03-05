const CandidateAnalysis = require('../models/CandidateAnalysis');

// Save analysis result for a candidate
exports.saveAnalysis = async (req, res) => {
  try {
    const {
      jobRole, score, matchPercentage, skills, matchedSkills,
      missingSkills, experience, candidateData, jobData, resumeFile
    } = req.body;

    if (!jobRole) {
      return res.status(400).json({ error: 'Job role is required' });
    }

    const analysis = await CandidateAnalysis.create({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      jobRole,
      score: score || 0,
      matchPercentage: matchPercentage || 0,
      skills: skills || [],
      matchedSkills: matchedSkills || [],
      missingSkills: missingSkills || [],
      experience: experience || 0,
      resumeFile: resumeFile || '',
      candidateData: candidateData || {},
      jobData: jobData || {}
    });

    res.status(201).json(analysis);
  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
};

// Get all analyses for current candidate
exports.getMyAnalyses = async (req, res) => {
  try {
    const analyses = await CandidateAnalysis.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(50);

    res.json(analyses);
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
};

// Get single analysis detail
exports.getAnalysis = async (req, res) => {
  try {
    const analysis = await CandidateAnalysis.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
};

// Delete an analysis
exports.deleteAnalysis = async (req, res) => {
  try {
    const analysis = await CandidateAnalysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
};

// Get candidate stats
exports.getStats = async (req, res) => {
  try {
    const analyses = await CandidateAnalysis.find({ userId: req.user._id });
    
    const totalAnalyses = analyses.length;
    const avgScore = totalAnalyses > 0
      ? Math.round(analyses.reduce((sum, a) => sum + (a.score || 0), 0) / totalAnalyses)
      : 0;
    const bestScore = totalAnalyses > 0
      ? Math.max(...analyses.map(a => a.score || 0))
      : 0;
    const allSkills = [...new Set(analyses.flatMap(a => a.skills || []))];
    const rolesAnalyzed = [...new Set(analyses.map(a => a.jobRole))];

    res.json({
      totalAnalyses,
      avgScore,
      bestScore,
      totalSkills: allSkills.length,
      rolesAnalyzed: rolesAnalyzed.length,
      topSkills: allSkills.slice(0, 10),
      recentRoles: rolesAnalyzed.slice(0, 5)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
