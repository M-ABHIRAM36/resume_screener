const fs = require('fs');
const path = require('path');
const jobsFile = path.join(__dirname, '..', 'data', 'jobs.json');
const mock = require('../services/mockMlService');

function readJobs(){ try{ return JSON.parse(fs.readFileSync(jobsFile)); }catch(e){ return []; } }

exports.getDashboard = (req, res) => {
  const jobId = req.params.jobId;
  const jobs = readJobs();
  const job = jobs.find(j=>j.id===jobId);
  if(!job) return res.status(404).json({error:'Job not found'});

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
}
