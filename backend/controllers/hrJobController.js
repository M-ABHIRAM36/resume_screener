const Job = require('../models/Job');

exports.createJob = async (req, res) => {
  try {
    const { jobTitle, requiredSkills, experienceRange, location } = req.body;
    if(!jobTitle) return res.status(400).json({error:'jobTitle required'});
    const id = 'job_'+Date.now();
    const job = await Job.create({ jobId: id, name: jobTitle, requiredSkills: requiredSkills || [], experienceRange: experienceRange || '', location: location || '' });
    res.json({ id: job.jobId, name: job.name, requiredSkills: job.requiredSkills, experienceRange: job.experienceRange, location: job.location });
  } catch(err) {
    console.error('createJob error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.find().lean();
    const formatted = jobs.map(j => ({ id: j.jobId, name: j.name, requiredSkills: j.requiredSkills, experienceRange: j.experienceRange, location: j.location, roadmapSteps: j.roadmapSteps }));
    const desired = 50;
    if (formatted.length >= desired) return res.json(formatted);
    // synthesize additional mock jobs to reach `desired` count
    const poolSkills = [
      'JavaScript','TypeScript','React','Node.js','Express','Python','Django','Flask','Pandas','NumPy',
      'scikit-learn','TensorFlow','PyTorch','SQL','Postgres','MongoDB','AWS','Docker','Kubernetes','Golang',
      'C++','Java','Spring','Kotlin','Swift','Objective-C','HTML','CSS','Tailwind','Bootstrap','GraphQL'
    ];
    const generated = Array.from({length: Math.max(0, desired - formatted.length)}).map((_,idx)=>{
      const n = formatted.length + idx + 1;
      const id = 'job_gen_' + (10000 + n);
      const nameTypes = ['Software Engineer','Frontend Developer','Backend Developer','Data Scientist','ML Engineer','DevOps Engineer','Mobile Developer','QA Engineer','Product Manager','Technical Lead'];
      const name = nameTypes[n % nameTypes.length] + ' ' + n;
      const skills = [];
      for(let i=0;i<4;i++) skills.push(poolSkills[(n*i + i) % poolSkills.length]);
      return { id, name, requiredSkills: skills, experienceRange: '1-4', location: 'Remote', roadmapSteps: [] };
    });
    return res.json(formatted.concat(generated));
  } catch(err) {
    console.error('listJobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
exports.getJob = async (req, res) => {
  try {
    const id = req.params.id;
    const job = await Job.findOne({ jobId: id }).lean();
    if(!job) return res.status(404).json({error:'Job not found'});
    res.json({ id: job.jobId, name: job.name, requiredSkills: job.requiredSkills, experienceRange: job.experienceRange, location: job.location, roadmapSteps: job.roadmapSteps });
  } catch(err) {
    console.error('getJob error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
