import rateLimit from 'express-rate-limit';

// List operations - generous limits for read operations
export const bagsListRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many bags list requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test',
});

// Create operations - moderate limits to prevent spam
export const bagsCreateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 bag creations per hour per IP
  message: {
    success: false,
    message: 'Too many bag creation requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Update operations - generous limits for modifications
export const bagsUpdateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 updates per hour per IP
  message: {
    success: false,
    message: 'Too many bag update requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Delete operations - moderate limits for safety
export const bagsDeleteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 deletions per hour per IP
  message: {
    success: false,
    message: 'Too many bag deletion requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Bulk operations - strict limits for resource-intensive operations
export const bagsBulkRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bulk operations per hour per IP
  message: {
    success: false,
    message: 'Too many bulk operations, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
