import mysql from 'mysql2/promise';

// Récupération de la configuration sécurisée
const config = useRuntimeConfig();

export const pool = mysql.createPool({
  host: config.dbHost,
  user: config.dbUser,
  password: config.dbPass,
  database: config.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});