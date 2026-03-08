<<<<<<< HEAD
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
=======
const path = require('path');
const fs = require('fs');

/**
 * POST /candidate/analyze
 * Accepts a single resume + job info, returns detailed analysis for candidate view.
 */
exports.analyzeResume = async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: 'Please upload a resume file' });
  }

  // Build job object from form fields
  const jobTitle = req.body.jobTitle || 'Software Developer';
  let requiredSkills = [];
  if (req.body.requiredSkills) {
    try {
      requiredSkills = typeof req.body.requiredSkills === 'string'
        ? JSON.parse(req.body.requiredSkills)
        : req.body.requiredSkills;
    } catch (e) {
      requiredSkills = [];
    }
  }

  const job = {
    id: req.body.jobId || `cand_${Date.now()}`,
    name: jobTitle,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    description: req.body.jobDescription || '',
    location: req.body.jobLocation || ''
  };

  console.log('[Candidate] Analyzing resume for:', job.name, '| Skills:', job.requiredSkills.length);

  let analyzed = [];
  try {
    const ml = require('../services/mlService');
    analyzed = await ml.analyze(job, files, req.body.nameMethod || 'filename');
    console.log('[Candidate] ML returned', analyzed?.length || 0, 'results');
  } catch (e) {
    console.error('[Candidate] ML service failed:', e.message);
    return res.status(500).json({ error: 'ML service error: ' + (e.message || String(e)) });
  }

  // Return first result (candidate only uploads 1 resume)
  const candidate = analyzed[0] || null;
  if (!candidate) {
    return res.status(500).json({ error: 'Failed to analyze resume' });
  }

  // Build summary text
  const matched = candidate.matchedSkills || [];
  const missing = candidate.missingSkills || [];
  const total = job.requiredSkills.length;
  let summary = '';
  if (total > 0) {
    summary = `Your resume matches ${matched.length} of ${total} required skills for ${jobTitle}.`;
    if (candidate.experience > 0) {
      summary += ` Your experience (${candidate.experience} yr${candidate.experience !== 1 ? 's' : ''}) is ${candidate.experience >= 3 ? 'strong' : 'developing'}.`;
    } else {
      summary += ' No professional experience was detected.';
    }
    if (missing.length > 0) {
      summary += ` You're missing: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ` and ${missing.length - 4} more` : ''}.`;
    }
    if (candidate.score >= 70) {
      summary += ' Your resume is competitive for this role!';
    } else if (candidate.score >= 45) {
      summary += ' Consider strengthening your resume with projects or certifications.';
    } else {
      summary += ' Focus on building relevant skills and projects to improve your match.';
    }
  } else {
    summary = `Resume analyzed for ${jobTitle}. Score: ${candidate.score}%.`;
  }

  res.json({
    success: true,
    candidate: candidate,
    summary: summary,
    jobTitle: jobTitle,
    requiredSkills: job.requiredSkills
  });
>>>>>>> development2
};
