interface JwtPayload {
  exp?: number;
  iat?: number;
}

/** Debe coincidir con JWT_EXPIRES_IN del API (12h). */
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * true si no hay token, está mal formado o la sesión ya no es válida.
 * Además de `exp`, aplica tope de SESSION_MAX_AGE_SECONDS desde `iat`
 * (tokens legacy con exp de 7d quedan invalidados a las 12h).
 */
export function isAccessTokenExpired(
  token: string | null,
  skewSeconds = 30,
): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  const nowSec = Math.floor(Date.now() / 1000) + skewSeconds;
  if (payload.exp <= nowSec) return true;

  if (payload.iat != null) {
    const policyExpiry = payload.iat + SESSION_MAX_AGE_SECONDS;
    if (policyExpiry <= nowSec) return true;
  }

  return false;
}
