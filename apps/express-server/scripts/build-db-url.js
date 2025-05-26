// apps/express-server/scripts/build-db-url.js
// Helper to build DATABASE_URL from Kubernetes environment variables

import dotenv from 'dotenv';

dotenv.config();

function buildDatabaseUrl() {
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.DB_HOST || 'postgres-service';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.POSTGRES_DB;

  if (!user || !password || !database) {
    console.error('❌ Missing required environment variables:');
    console.error('Required: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB');
    console.error('Optional: DB_HOST (defaults to postgres-service), DB_PORT (defaults to 5432)');
    process.exit(1);
  }

  const url = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  console.log('✅ Database URL constructed:', url.replace(password, '***'));
  return url;
}

// Set DATABASE_URL environment variable
process.env.DATABASE_URL = buildDatabaseUrl();
console.log('🔗 DATABASE_URL is ready for Prisma');
