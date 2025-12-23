const fs = require('fs');
const path = require('path');
const jobsFile = path.join(__dirname, '..', 'data', 'jobs.json');

function readJobs(){ try{ return JSON.parse(fs.readFileSync(jobsFile)); }catch(e){ return []; } }
function writeJobs(j){ fs.writeFileSync(jobsFile, JSON.stringify(j, null, 2)); }

exports.createJob = (req, res) => {
  const { jobTitle, requiredSkills, experienceRange, location } = req.body;
  if(!jobTitle) return res.status(400).json({error:'jobTitle required'});
  const jobs = readJobs();
  const id = 'job_'+Date.now();
  const job = { id, name: jobTitle, requiredSkills: requiredSkills || [], experienceRange: experienceRange || '', location: location || '' };
  jobs.push(job);
  writeJobs(jobs);
  res.json(job);
}

exports.listJobs = (req, res) => {
  res.json(readJobs());
}

exports.getJob = (req, res) => {
  const id = req.params.id;
  const jobs = readJobs();
  const job = jobs.find(j=>j.id===id);
  if(!job) return res.status(404).json({error:'Job not found'});
  res.json(job);
}
