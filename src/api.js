const BASE_URL = 'http://localhost:5000';

export async function get(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function post(endpoint, data, isFormData = false) {
  const options = {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  };
  
  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }
  
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
