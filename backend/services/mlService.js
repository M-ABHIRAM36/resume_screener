const http = require('http');
const https = require('https');
const { URL } = require('url');

const ML_URL = process.env.ML_URL || 'http://localhost:8000/analyze';

function postJson(urlStr, body){
  const url = new URL(urlStr);
  const data = JSON.stringify(body);
  const opts = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + (url.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject)=>{
    const req = lib.request(opts, (res)=>{
      let raw = '';
      res.on('data', (chunk)=> raw += chunk);
      res.on('end', ()=>{
        try{ const parsed = JSON.parse(raw); resolve(parsed); }catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function analyze(job, files){
  const body = { job, filesMeta: { count: (files && files.length) || 5 } };
  try{
    const data = await postJson(ML_URL, body);
    return data;
  }catch(e){
    console.warn('mlService.analyze failed', e && e.message ? e.message : e);
    throw e;
  }
}

module.exports = { analyze };
