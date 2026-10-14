import { createHash, randomBytes } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'mk_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    // Same-origin (front + API Nuxt) : Lax. En local HTTP, None exigerait Secure.
    // Si l'API est un jour servi depuis un autre domaine en HTTPS, passer à 'none'.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  };
}

export function toPublicUser(row) {
  return {
    id: row.ID_user,
    pseudo: row.user_pseudo,
    role: row.user_role,
    score: row.user_score
  };
}

export function setSessionCookie(event, token) {
  setCookie(event, SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookie(event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

export async function createSession(event, userId) {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await pool.query(
    'INSERT INTO auth_sessions (session_token_hash, ID_user, session_expires_at) VALUES (?, ?, ?)',
    [tokenHash, userId, expiresAt]
  );

  setSessionCookie(event, token);
}

export async function getSessionUser(event) {
  const token = getCookie(event, SESSION_COOKIE_NAME);
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const [rows] = await pool.query(
    `SELECT u.ID_user, u.user_pseudo, u.user_role, u.user_score
     FROM auth_sessions s
     INNER JOIN users u ON u.ID_user = s.ID_user
     WHERE s.session_token_hash = ?
       AND s.session_expires_at > NOW()`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return null;
  }

  return toPublicUser(rows[0]);
}

export async function destroySession(event) {
  const token = getCookie(event, SESSION_COOKIE_NAME);

  if (token) {
    const tokenHash = hashSessionToken(token);
    await pool.query('DELETE FROM auth_sessions WHERE session_token_hash = ?', [tokenHash]);
  }

  clearSessionCookie(event);
}
