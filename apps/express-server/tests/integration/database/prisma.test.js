// Test suite for Prisma ORM database connection and basic operations

import {
  describe, it, expect, beforeAll, afterAll,
} from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Prisma ORM Database Connection', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
        },
      },
    });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      expect(prisma).toBeDefined();

      // Test the connection with a simple query
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result[0].connected).toBe(1);
    });

    it('should have access to users table', async () => {
      // Test that we can query the users table (even if empty)
      const users = await prisma.users.findMany({ take: 1 });
      expect(Array.isArray(users)).toBe(true);
    });

    it('should have access to user_profiles table', async () => {
      // Test that we can query the user_profiles table (even if empty)
      const profiles = await prisma.user_profiles.findMany({ take: 1 });
      expect(Array.isArray(profiles)).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should have proper model structure for users', async () => {
      // Test that Prisma client has the expected models
      expect(prisma.users).toBeDefined();
      expect(typeof prisma.users.create).toBe('function');
      expect(typeof prisma.users.findMany).toBe('function');
      expect(typeof prisma.users.findUnique).toBe('function');
      expect(typeof prisma.users.update).toBe('function');
      expect(typeof prisma.users.delete).toBe('function');
    });

    it('should have proper model structure for user_profiles', async () => {
      expect(prisma.user_profiles).toBeDefined();
      expect(typeof prisma.user_profiles.create).toBe('function');
      expect(typeof prisma.user_profiles.findMany).toBe('function');
      expect(typeof prisma.user_profiles.update).toBe('function');
      expect(typeof prisma.user_profiles.delete).toBe('function');
    });
  });
});
