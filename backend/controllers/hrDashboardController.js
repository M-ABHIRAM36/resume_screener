const Job = require('../models/Job');
const mock = require('../services/mockMlService');

exports.getDashboard = async (req, res) => {
  try {
  const jobId = req.params.jobId;
  const jobDoc = await Job.findOne({ jobId }).lean();
  if(!jobDoc) return res.status(404).json({error:'Job not found'});
  const job = { id: jobDoc.jobId, name: jobDoc.name, requiredSkills: jobDoc.requiredSkills, experienceRange: jobDoc.experienceRange, location: jobDoc.location };

  // params
  const { skill, location, college, experience, minMatchPercentage, topN } = req.query;

  let candidates = mock.generateCandidatesForJob(job, 25);

  if(skill) candidates = candidates.filter(c=> c.skills.map(s=>s.toLowerCase()).includes(String(skill).toLowerCase()));
  if(location) candidates = candidates.filter(c=> String(c.location).toLowerCase() === String(location).toLowerCase());
  if(college) candidates = candidates.filter(c=> String(c.college).toLowerCase() === String(college).toLowerCase());
  if(experience) candidates = candidates.filter(c=> c.experience >= Number(experience));
  if(minMatchPercentage) candidates = candidates.filter(c=> c.matchPercentage >= Number(minMatchPercentage));

  candidates.sort((a,b)=> b.score - a.score);

  let n = topN ? Number(topN) : candidates.length;
  if(n < candidates.length) candidates = candidates.slice(0,n);

  res.json(candidates);
  } catch(err) {
    console.error('getDashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
