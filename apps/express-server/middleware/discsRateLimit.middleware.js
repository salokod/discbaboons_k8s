import rateLimit from 'express-rate-limit';

// Disc search operations - generous limits for reference data lookups
export const discsSearchRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many disc searches, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test',
});

// Disc submission operations - moderate limits to prevent spam
export const discsSubmissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 disc submissions per hour per IP
  message: {
    success: false,
    message: 'Too many disc submissions, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Admin operations - generous limits for administrative tasks
export const discsAdminRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 admin operations per hour per IP
  message: {
    success: false,
    message: 'Too many admin operations, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
