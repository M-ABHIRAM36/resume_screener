const BASE_URL = 'http://localhost:5000';

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function get(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function post(endpoint, data, isFormData = false) {
  const options = {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  };

  if (!isFormData) {
    options.headers = authHeaders({ 'Content-Type': 'application/json' });
  } else {
    options.headers = authHeaders();
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function getUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
