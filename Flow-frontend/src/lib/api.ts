const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function getToken(): string | null {
  return localStorage.getItem('jwtToken');
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(url, init);

  if (res.status === 401) {
    // Don't redirect for auth endpoints - let them handle their own errors
    const isAuthEndpoint = path.startsWith('/api/auth');

    if (!isAuthEndpoint) {
      // Clear token and force a reload so app can handle logout
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }

    // For auth endpoints, parse the error message and throw
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json') && text ? JSON.parse(text) : text;
    const msg = (body && (body.message || body.error)) || 'Invalid credentials';
    throw new Error(msg);
  }

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  const body = contentType.includes('application/json') && text ? JSON.parse(text) : text;

  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || res.statusText;
    throw new Error(msg || 'Request failed');
  }

  return body;
}

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: any) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: any) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: any) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: (path: string) => request(path, { method: 'DELETE' }),
  raw: request,
  setBaseUrl: (url: string) => { /* noop for now - Vite env handles base */ }
};

export default api;
