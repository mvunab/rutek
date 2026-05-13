const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  readonly cause?: unknown;
  constructor(message = 'No se pudo contactar al servidor', cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

export const isNetworkError = (err: unknown): err is NetworkError =>
  err instanceof NetworkError;

export const isHttpError = (err: unknown): err is ApiError =>
  err instanceof ApiError;

type NetworkErrorListener = (err: NetworkError) => void;
const networkErrorListeners = new Set<NetworkErrorListener>();

export function onNetworkError(listener: NetworkErrorListener) {
  networkErrorListeners.add(listener);
  return () => networkErrorListeners.delete(listener);
}

function notifyNetworkError(err: NetworkError) {
  for (const fn of networkErrorListeners) {
    try {
      fn(err);
    } catch {
      // listener no debe romper el flujo
    }
  }
}

export const ACCESS_TOKEN_KEY = 'rutek-access-token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (err) {
    const netErr = new NetworkError(undefined, err);
    notifyNetworkError(netErr);
    throw netErr;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Verifica si el backend está alcanzable.
 *
 * Cualquier respuesta HTTP (200, 401, 404, 500...) significa "alcanzable".
 * Solo un fallo de red (fetch lanza) significa "caído".
 *
 * Intenta primero /health (estándar) y cae a / como fallback.
 */
export async function pingBackend(signal?: AbortSignal): Promise<boolean> {
  const endpoints = ['/health', '/'];
  for (const path of endpoints) {
    try {
      await fetch(`${API_URL}${path}`, {
        method: 'GET',
        signal,
        cache: 'no-store',
      });
      return true;
    } catch {
      // continuar con el siguiente endpoint
    }
  }
  return false;
}

export const getApiUrl = () => API_URL;
