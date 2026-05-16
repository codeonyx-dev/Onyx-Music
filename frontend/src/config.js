// Vacío = misma URL que el frontend (nginx hace proxy a /api en Docker / OMV).
// En desarrollo: usa proxy de package.json o REACT_APP_API_URL=http://localhost:9090
const configured = process.env.REACT_APP_API_URL;
export const API_URL =
  configured !== undefined && configured !== ''
    ? configured.replace(/\/$/, '')
    : '';

const TOKEN_KEY = 'onyx_token';
const USER_KEY = 'onyx_user';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSession(token, username) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, username);
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getUsername() {
  return sessionStorage.getItem(USER_KEY);
}

export function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new Event('onyx:logout'));
  }

  return response;
}

function withToken(url) {
  const token = getToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

export function streamUrl(filename) {
  return withToken(`${API_URL}/api/stream/${encodeURIComponent(filename)}`);
}

export function coverUrl(filename) {
  return withToken(`${API_URL}/api/cover/${encodeURIComponent(filename)}`);
}
