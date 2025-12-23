const path = require('path');
const fs = require('fs');
const mock = require('../services/mockMlService');
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
  const jobs = readJobs();
  const job = jobId ? jobs.find(j=>j.id===jobId) : (jobs[0] || { requiredSkills: [] });

  // Try calling external ML service (Flask mock). If it fails, fall back to internal mock.
  let analyzed = []
  try{
    const ml = require('../services/mlService');
    analyzed = await ml.analyze(job, files);
  }catch(e){
    analyzed = mock.generateFromFiles(job, files);
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
