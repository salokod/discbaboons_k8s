import rateLimit from 'express-rate-limit';

// Skip rate limiting in test environment
const skipRateLimit = process.env.NODE_ENV === 'test';

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Don't skip successful requests
  skipFailedRequests: false, // Don't skip failed requests
  skip: () => skipRateLimit, // Skip rate limiting in test environment
});

// More restrictive rate limiting for password-related endpoints
const passwordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit, // Skip rate limiting in test environment
});

export { authRateLimit, passwordRateLimit };
