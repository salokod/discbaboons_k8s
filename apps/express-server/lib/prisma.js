// apps/express-server/lib/prisma.js
// Prisma client instance for database operations

import { PrismaClient } from '@prisma/client';

// Create Prisma client with logging for development
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
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
