const BASE = 'http://localhost:3001';

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const API = {
  login:          (username, password)          => request('POST',   '/api/sessions', { username, password }),
  signup:         (username, email, password)    => request('POST',   '/api/users', { username, email, password }),
  requestPasswordReset: (identifier)             => request('POST',   '/api/password-reset', { identifier }),
  logout:         ()                   => request('DELETE', '/api/sessions/current'),
  getCurrentUser: ()                   => request('GET',    '/api/sessions/current'),
  getNetwork:     ()                   => request('GET',    '/api/network'),
  createGame:     ()                   => request('POST',   '/api/games'),
  getGame:        (id)                 => request('GET',    `/api/games/${id}`),
  executeGame:    (id, route)          => request('POST',   `/api/games/${id}/execute`, { route }),
  getRanking:     ()                   => request('GET',    '/api/ranking'),
};

export default API;
