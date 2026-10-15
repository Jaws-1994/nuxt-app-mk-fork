const PRODUCTION_ORIGINS = [
  'https://app-user-mk-48xl.vercel.app/'
];

const DEV_ORIGINS = [
  'https://app-user-mk-48xl.vercel.app/',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
];

function getAllowedOrigins() {
  const fromEnv = String(useRuntimeConfig().corsOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  return process.env.NODE_ENV === 'production' ? PRODUCTION_ORIGINS : DEV_ORIGINS;
}

export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin');
  if (!origin) {
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins.includes(origin)) {
    return;
  }

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  });

  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204);
    return '';
  }
});
