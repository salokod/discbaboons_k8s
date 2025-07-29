import express from 'express';

// Request size limiting middleware for auth endpoints
const authRequestLimit = express.json({
  limit: '1mb', // Limit request body size to 1MB for auth endpoints
  strict: true, // Only parse arrays and objects
});

// More restrictive limit for security-sensitive endpoints
const restrictiveRequestLimit = express.json({
  limit: '100kb', // Smaller limit for password/sensitive endpoints
  strict: true,
});

export { authRequestLimit, restrictiveRequestLimit };
