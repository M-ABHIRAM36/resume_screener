const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const ML_URL = process.env.ML_URL || 'http://localhost:8000/analyze';

async function analyze(job, files){
  // If files available, send multipart/form-data to ML server
  if(files && files.length){
    const form = new FormData();
    form.append('job', JSON.stringify(job || {}));
    files.forEach((f, idx)=>{
      try{
        const stream = fs.createReadStream(f.path);
        form.append('resumes', stream, { filename: f.originalname || path.basename(f.path) });
      }catch(e){ console.warn('mlService: could not attach file', f.path, e && e.message); }
    });

    const headers = form.getHeaders();
    try{
      const resp = await fetch(ML_URL, { method: 'POST', body: form, headers });
      if(!resp.ok) throw new Error('ML server responded ' + resp.status);
      const data = await resp.json();
      return data;
    }catch(e){
      console.warn('mlService.analyze multipart failed', e && e.message ? e.message : e);
      throw e;
    }
  }

  // fallback: send minimal json (older behavior)
  const body = { job, filesMeta: { count: (files && files.length) || 5 } };
  try{
    const resp = await fetch(ML_URL, { method:'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
    if(!resp.ok) throw new Error('ML server responded ' + resp.status);
    const data = await resp.json();
    return data;
  }catch(e){
    console.warn('mlService.analyze json fallback failed', e && e.message ? e.message : e);
    throw e;
  }
}

module.exports = { analyze };
