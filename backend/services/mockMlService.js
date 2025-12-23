const fs = require('fs');
const path = require('path');

const colleges = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','dummyColleges.json')));
const locations = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','dummyLocations.json')));

const NAMES = ['Amit Kumar','Priya Singh','Rohit Sharma','Anita Desai','Diana Ross','Vikram Desai','Uma Rao','Karan Patel','Sara Ali','John Doe','Jane Smith','Robert Brown','Lisa Wong','Carlos Diaz','Fatima Khan'];
const EXTRA_SKILLS = ['APIs','Docker','Kubernetes','SQL','NoSQL','CI/CD','GraphQL','TypeScript','Python','Django','Flask','HTML','CSS','Tailwind','React','Node.js','AWS','GCP','Azure','Testing'];

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
function pick(arr, n){ const out = []; const a = arr.slice(); while(out.length<n && a.length){ const i = Math.floor(Math.random()*a.length); out.push(a.splice(i,1)[0]); } return out }

function generateCandidate(id, job){
  const name = NAMES[id % NAMES.length];
  const email = name.toLowerCase().replace(/\s+/g,'.') + (randInt(1,99)) + '@example.com';
  const req = (job.requiredSkills||[]);
  const matchesCount = Math.max(1, Math.floor(req.length * (0.5 + Math.random()*0.4))); // 50%-90% of req
  const matched = pick(req, Math.min(matchesCount, req.length));
  const extra = pick(EXTRA_SKILLS, randInt(1,3));
  const skills = Array.from(new Set([...matched, ...extra]));
  const missingSkills = req.filter(s=>!skills.map(x=>x.toLowerCase()).includes(s.toLowerCase()));
  const location = locations[id % locations.length];
  const college = colleges[id % colleges.length];
  const experience = randInt(1,12);
  // base match from overlap
  const baseMatch = req.length>0 ? Math.round((matched.length / req.length) * 100) : 60;
  const matchPercentage = Math.min(95, Math.max(60, baseMatch + randInt(-5,10)));
  const score = Math.min(100, Math.max(0, Math.round((matchPercentage * 0.7) + randInt(-10,10))));
  const resumeStrength = score > 75 ? 'Strong' : score > 50 ? 'Average' : 'Weak';
  const jobFitLevel = matchPercentage > 80 ? 'High' : matchPercentage > 70 ? 'Medium' : 'Low';

  return {
    candidateId: 'cand_' + (Date.now() + id),
    name,
    email,
    skills,
    missingSkills,
    experience,
    college,
    location,
    matchPercentage,
    score,
    resumeStrength,
    jobFitLevel
  }
}

exports.generateCandidatesForJob = (job, count=25) => {
  const list = [];
  for(let i=0;i<count;i++) list.push(generateCandidate(i, job));
  return list;
}

exports.generateFromFiles = (job, files) => {
  // simulate analysis per uploaded file
  return files.map((f,i)=> generateCandidate(i, job));
}
