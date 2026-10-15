import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function hashJti(jti) {
  return createHash('sha256').update(jti).digest('hex');
}

function getJwtSecretKey() {
  const secret = useRuntimeConfig().jwtSecret;
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'JWT_SECRET manquant'
    });
  }
  return new TextEncoder().encode(secret);
}

function getBearerToken(event) {
  const header = getHeader(event, 'authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

export function toPublicUser(row) {
  return {
    id: row.ID_user,
    pseudo: row.user_pseudo,
    role: row.user_role,
    score: row.user_score
  };
}

export async function createSession(userId) {
  const jti = randomBytes(32).toString('base64url');
  const tokenHash = hashJti(jti);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await pool.query(
    'INSERT INTO auth_sessions (session_token_hash, ID_user, session_expires_at) VALUES (?, ?, ?)',
    [tokenHash, userId, expiresAt]
  );

  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecretKey());
}

async function readJwt(event) {
  const token = getBearerToken(event);
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256']
    });
    if (!payload.jti || !payload.sub) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionUser(event) {
  const payload = await readJwt(event);
  if (!payload) {
    return null;
  }

  const tokenHash = hashJti(payload.jti);
  const [rows] = await pool.query(
    `SELECT u.ID_user, u.user_pseudo, u.user_role, u.user_score
     FROM auth_sessions s
     INNER JOIN users u ON u.ID_user = s.ID_user
     WHERE s.session_token_hash = ?
       AND s.ID_user = ?
       AND s.session_expires_at > NOW()`,
    [tokenHash, payload.sub]
  );

  if (rows.length === 0) {
    return null;
  }

  return toPublicUser(rows[0]);
}

export async function destroySession(event) {
  const payload = await readJwt(event);
  if (!payload) {
    return;
  }

  await pool.query('DELETE FROM auth_sessions WHERE session_token_hash = ?', [
    hashJti(payload.jti)
  ]);
}
