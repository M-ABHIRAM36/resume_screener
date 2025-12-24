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

  let attached = false;
  if(files && files.length){
    files.forEach((f, idx) => {
      try{
        if(f && f.path && fs.existsSync(f.path)){
          const stream = fs.createReadStream(f.path);
          form.append('resumes', stream, { filename: f.originalname || path.basename(f.path) });
          attached = true;
        }
      }catch(e){
        console.warn('mlService: could not attach file', f && f.path, e && e.message);
      }
    });
  }

  const headers = form.getHeaders();
  try{
    const resp = await fetch(ML_URL, { method: 'POST', body: form, headers });
    if(resp.status === 422){
      const body = await resp.text();
      console.warn('mlService.analyze: validation error from ML service (422):', body);
      // fallback to JSON endpoint with filesMeta
      const bodyJson = { job, filesMeta: { count: (files && files.length) || 0 } };
      const resp2 = await fetch(ML_URL, { method:'POST', body: JSON.stringify(bodyJson), headers: { 'Content-Type': 'application/json' } });
      if(!resp2.ok) throw new Error('ML server responded ' + resp2.status + ' (fallback)');
      const data2 = await resp2.json();
      return data2;
    }
    if(!resp.ok) throw new Error('ML server responded ' + resp.status);
    const data = await resp.json();
    return data;
  }catch(e){
    console.warn('mlService.analyze failed', e && e.message ? e.message : e);
    // If multipart failed and we didn't attach files, try JSON fallback
    if(!attached){
      try{
        const bodyJson = { job, filesMeta: { count: (files && files.length) || 0 } };
        const resp = await fetch(ML_URL, { method:'POST', body: JSON.stringify(bodyJson), headers: { 'Content-Type': 'application/json' } });
        if(!resp.ok) throw new Error('ML server responded ' + resp.status + ' (json fallback)');
        const data = await resp.json();
        return data;
      }catch(e2){
        console.warn('mlService.json fallback failed', e2 && e2.message ? e2.message : e2);
      }
    }
    throw e;
  }
}

module.exports = { analyze };
