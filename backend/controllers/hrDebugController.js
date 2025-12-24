exports.checkMl = async (req, res) => {
  const jobsFile = require('path').join(__dirname, '..', 'data', 'jobs.json');
  const fs = require('fs');
  let jobs = [];
  try{ jobs = JSON.parse(fs.readFileSync(jobsFile)); }catch(e){ jobs = []; }
  const job = jobs[0] || { requiredSkills: ['React','Node.js','APIs'] };

  try{
    const ml = require('../services/mlService');
    const data = await ml.analyze(job, [{filename:'test'}]);
    return res.json({ source: 'external', length: data.length, sample: data.slice(0,3) });
  }catch(e){
    console.error('ML service failed', e);
    return res.status(500).json({ error: 'ML service error', details: String(e) });
  }
}
