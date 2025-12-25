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
  const jobs = readJobs();
  const desired = 50;
  if (Array.isArray(jobs) && jobs.length >= desired) {
    return res.json(jobs);
  }
  // synthesize additional mock jobs to reach `desired` count (do not modify file)
  const poolSkills = [
    'JavaScript','TypeScript','React','Node.js','Express','Python','Django','Flask','Pandas','NumPy',
    'scikit-learn','TensorFlow','PyTorch','SQL','Postgres','MongoDB','AWS','Docker','Kubernetes','Golang',
    'C++','Java','Spring','Kotlin','Swift','Objective-C','HTML','CSS','Tailwind','Bootstrap','GraphQL'
  ];
  const generated = Array.from({length: Math.max(0, desired - (jobs?jobs.length:0))}).map((_,idx)=>{
    const n = (jobs?jobs.length:0) + idx + 1;
    const id = 'job_gen_' + (10000 + n);
    const nameTypes = ['Software Engineer','Frontend Developer','Backend Developer','Data Scientist','ML Engineer','DevOps Engineer','Mobile Developer','QA Engineer','Product Manager','Technical Lead'];
    const name = nameTypes[n % nameTypes.length] + ' ' + n;
    const skills = [];
    for(let i=0;i<4;i++){
      skills.push(poolSkills[(n*i + i) % poolSkills.length]);
    }
    return { id, name, requiredSkills: skills, experienceRange: '1-4', location: 'Remote', roadmapSteps: [] };
  });
  return res.json((jobs||[]).concat(generated));
}
exports.getJob = (req, res) => {
  const id = req.params.id;
  const jobs = readJobs();
  const job = jobs.find(j=>j.id===id);
  if(!job) return res.status(404).json({error:'Job not found'});
  res.json(job);
}
