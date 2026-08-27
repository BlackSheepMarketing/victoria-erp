/**
 * Cliente HTTP que REEMPLAZA a customSupabaseClient.js.
 *
 * REGLA DE ORO #2 — Los hooks son la costura (Handoff §4).
 * Los ~40 hooks de datos dejan de llamar `supabase.from(...)` y pasan a llamar
 * `api.get/post/patch/del(...)`. Como la API nueva devuelve el mismo shape de
 * JSON (joins anidados incluidos), las 80 pantallas casi no se tocan.
 *
 * Maneja:
 *  - Base URL desde VITE_API_URL (ej: https://api.tudominio.com/api)
 *  - Bearer token en cada request
 *  - Refresh automatico del access token cuando expira (401)
 *  - Persistencia de tokens en localStorage
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ACCESS_KEY = 'victoria.access_token';
const REFRESH_KEY = 'victoria.refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// Evita multiples refresh simultaneos: si ya hay uno en curso, todos esperan.
let refreshPromise = null;

async function doRefresh() {
  const refresh_token = tokenStore.refresh;
  if (!refresh_token) throw new ApiError('Sesion expirada', 401);

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    tokenStore.clear();
    throw new ApiError('Sesion expirada', 401);
  }
  const data = await res.json();
  tokenStore.set(data);
  return data.access_token;
}

async function request(method, path, body, { retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const access = tokenStore.access;
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expirado -> intenta refrescar una vez y reintenta.
  if (res.status === 401 && retry && tokenStore.refresh) {
    try {
      refreshPromise = refreshPromise || doRefresh();
      await refreshPromise;
      refreshPromise = null;
      return request(method, path, body, { retry: false });
    } catch (e) {
      refreshPromise = null;
      throw e;
    }
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new ApiError(Array.isArray(msg) ? msg.join(', ') : msg, res.status, data);
  }
  return data;
}

/** Construye un querystring a partir de un objeto de filtros. */
function qs(params) {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

export const api = {
  get: (path, params) => request('GET', `${path}${qs(params)}`),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};

export { ApiError };
