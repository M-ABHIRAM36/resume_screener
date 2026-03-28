exports.checkMl = async (req, res) => {
  const Job = require('../models/Job');
  const firstJob = await Job.findOne().lean();
  const job = firstJob
    ? { id: firstJob.jobId, name: firstJob.name, requiredSkills: firstJob.requiredSkills }
    : { requiredSkills: ['React','Node.js','APIs'] };

  try{
    const ml = require('../services/mlService');
    const data = await ml.analyze(job, [{filename:'test'}]);
    return res.json({ source: 'external', length: data.length, sample: data.slice(0,3) });
  }catch(e){
    console.error('ML service failed', e);
    return res.status(500).json({ error: 'ML service error', details: String(e) });
  }
}
