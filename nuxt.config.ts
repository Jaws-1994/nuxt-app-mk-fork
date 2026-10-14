export default defineNuxtConfig({
  serverDir: 'server',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Expose les variables uniquement côté serveur
  runtimeConfig: {
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbPass: process.env.DB_PASS,
    dbName: process.env.DB_NAME
  }
})