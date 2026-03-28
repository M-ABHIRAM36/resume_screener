const path = require('path');
const Job = require('../models/Job');

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
  
  // First try to get job from MongoDB
  if(jobId) {
    const jobDoc = await Job.findOne({ jobId }).lean();
    if(jobDoc) {
      job = { id: jobDoc.jobId, name: jobDoc.name, requiredSkills: jobDoc.requiredSkills, description: '', location: jobDoc.location };
    }
  }
  
  // If job not found in jobs.json, build it from individual form fields sent by frontend
  if(!job && req.body) {
    const bodyTitle = req.body.jobTitle;
    let bodySkills = req.body.requiredSkills;

    // Frontend may also send jobData as a JSON blob — try that too
    if(!bodyTitle && req.body.jobData) {
      try {
        const jobData = typeof req.body.jobData === 'string' ? JSON.parse(req.body.jobData) : req.body.jobData;
        if(jobData.name || jobData.requiredSkills) {
          job = {
            id: jobId || `role_${Date.now()}`,
            name: jobData.name || 'Unknown Job',
            requiredSkills: jobData.requiredSkills || [],
            description: jobData.description || '',
            location: jobData.location || ''
          };
          console.log('Using jobData blob from frontend:', job.name);
        }
      } catch(e) {
        console.warn('Failed to parse jobData:', e);
      }
    }

    // Build from individual form fields (jobTitle + requiredSkills)
    if(!job && bodyTitle) {
      let skills = [];
      if(bodySkills) {
        try {
          skills = typeof bodySkills === 'string' ? JSON.parse(bodySkills) : bodySkills;
        } catch(e) {
          skills = [];
        }
      }
      job = {
        id: jobId || `role_${Date.now()}`,
        name: bodyTitle,
        requiredSkills: Array.isArray(skills) ? skills : [],
        description: req.body.jobDescription || '',
        location: req.body.jobLocation || ''
      };
      console.log('Using job from form fields:', job.name, 'Skills:', job.requiredSkills.length);
    }
  }
  
  // Fallback to first job in DB or empty job
  if(!job) {
    const firstJob = await Job.findOne().lean();
    if(firstJob) {
      job = { id: firstJob.jobId, name: firstJob.name, requiredSkills: firstJob.requiredSkills, description: '', location: firstJob.location };
    } else {
      job = { id: 'default', name: 'Default Job', requiredSkills: [], description: '', location: '' };
    }
    console.log('Using default/fallback job');
  }

  console.log('Using job for ML analysis:', job.name, 'Required skills:', job.requiredSkills?.length || 0);

  // Call external ML service (FastAPI). Return 500 if ML fails.
  let analyzed = []
  try{
    const ml = require('../services/mlService');
    analyzed = await ml.analyze(job, files, req.body.nameMethod);
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
