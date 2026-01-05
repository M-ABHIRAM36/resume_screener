const path = require('path');
const fs = require('fs');
const jobsFile = path.join(__dirname, '..', 'data', 'jobs.json');

function readJobs(){ try{ return JSON.parse(fs.readFileSync(jobsFile)); }catch(e){ return []; } }

function applyFilters(candidates, q){
  let list = candidates.slice();
  if(q.skill) list = list.filter(c=> c.skills.map(s=>s.toLowerCase()).includes(String(q.skill).toLowerCase()));
  if(q.location) list = list.filter(c=> String(c.location).toLowerCase() === String(q.location).toLowerCase());
  if(q.college) list = list.filter(c=> String(c.college).toLowerCase() === String(q.college).toLowerCase());
  if(q.experience) list = list.filter(c=> c.experience >= Number(q.experience));
  if(q.minMatchPercentage) list = list.filter(c=> c.matchPercentage >= Number(q.minMatchPercentage));
  if(q.topN) list = list.slice(0, Number(q.topN));
  return list;
}

exports.uploadResumes = async (req, res) => {
  const files = req.files || [];
  const saved = files.map(f=>({ originalname: f.originalname, filename: f.filename, path: f.path, size: f.size }));

  // jobId may be sent as form field or query param
  const jobId = req.body && req.body.jobId ? req.body.jobId : (req.query && req.query.jobId);
  let job = null;
  
  // First try to get job from jobs.json
  const jobs = readJobs();
  if(jobId) {
    job = jobs.find(j=>j.id===jobId);
  }
  
  // If job not found in jobs.json, try to use jobData from frontend
  if(!job && req.body && req.body.jobData) {
    try {
      const jobData = typeof req.body.jobData === 'string' ? JSON.parse(req.body.jobData) : req.body.jobData;
      job = {
        id: jobId || `role_${Date.now()}`,
        name: jobData.name || 'Unknown Job',
        requiredSkills: jobData.requiredSkills || [],
        description: jobData.description || '',
        location: jobData.location || ''
      };
      console.log('Using job data from frontend:', job.name);
    } catch(e) {
      console.warn('Failed to parse jobData:', e);
    }
  }
  
  // Fallback to first job or empty job
  if(!job) {
    job = jobs[0] || { 
      id: 'default',
      name: 'Default Job',
      requiredSkills: [],
      description: '',
      location: ''
    };
    console.log('Using default/fallback job');
  }

  console.log('Using job for ML analysis:', job.name, 'Required skills:', job.requiredSkills?.length || 0);

  // Call external ML service (FastAPI). Return 500 if ML fails.
  let analyzed = []
  try{
    const ml = require('../services/mlService');
    analyzed = await ml.analyze(job, files);
    console.log('ML service returned', analyzed?.length || 0, 'candidates');
  }catch(e){
    console.error('ML service failed', e);
    return res.status(500).json({ error: 'ML service error: ' + (e.message || String(e)) });
  }

  // read filters from form fields
  const q = {
    skill: req.body.skill || req.body.skill?.toString() || undefined,
    location: req.body.location || undefined,
    college: req.body.college || undefined,
    experience: req.body.experience || undefined,
    minMatchPercentage: req.body.minMatchPercentage || undefined,
    topN: req.body.topN || undefined
  };

  const filtered = applyFilters(analyzed, q);

  res.json({ uploaded: saved, analyzed: filtered });
}
