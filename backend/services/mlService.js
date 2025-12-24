const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const ML_URL = process.env.ML_URL || 'http://localhost:8000/analyze-resumes';

async function analyze(job, files){
  const form = new FormData();
  // Map job fields expected by FastAPI
  form.append('job_title', job && (job.name || job.title) ? (job.name || job.title) : '');
  form.append('job_description', job && (job.description || job.jobDescription) ? (job.description || job.jobDescription) : '');
  const reqSkills = job && (job.requiredSkills || job.required_skills) ? (job.requiredSkills || job.required_skills) : [];
  if(Array.isArray(reqSkills)){
    reqSkills.forEach(s => form.append('required_skills', typeof s === 'string' ? s : String(s)));
  }

  // attach resume files
  if(files && files.length){
    files.forEach((f, idx) => {
      try{
        const stream = fs.createReadStream(f.path);
        form.append('resumes', stream, { filename: f.originalname || path.basename(f.path) });
      }catch(e){
        console.warn('mlService: could not attach file', f.path, e && e.message);
      }
    });
  }

  const headers = form.getHeaders();
  try{
    const resp = await fetch(ML_URL, { method: 'POST', body: form, headers });
    if(!resp.ok) throw new Error('ML server responded ' + resp.status);
    const data = await resp.json();
    return data;
  }catch(e){
    console.warn('mlService.analyze failed', e && e.message ? e.message : e);
    throw e;
  }
}

module.exports = { analyze };
