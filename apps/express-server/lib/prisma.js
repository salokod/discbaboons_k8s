// apps/express-server/lib/prisma.js
// Prisma client instance for database operations

import { PrismaClient } from '@prisma/client';

// Configure log levels based on environment
const getLogConfig = () => {
  if (process.env.NODE_ENV === 'test') {
    return []; // No logs in tests
  }

  if (process.env.NODE_ENV === 'development') {
    return ['query', 'info', 'warn', 'error'];
  }

  return ['error']; // Only errors in production
};

// Create Prisma client with conditional logging
const prisma = new PrismaClient({
  log: getLogConfig(),
  errorFormat: 'pretty',
});

// Test database connection
export async function testPrismaConnection() {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1 as test`;

    // Show some stats about your data
    // const userCount = await prisma.users.count();
    // const profileCount = await prisma.user_profiles.count();

    return true;
  } catch (error) {
    return false;
  }
}

// Graceful shutdown
async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Handle shutdown signals
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);

export default prisma;
