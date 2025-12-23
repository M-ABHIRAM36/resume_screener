const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function get(path){
  const res = await fetch(API_BASE + path);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function post(path, body){
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function postForm(path, formData){
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    body: formData
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
