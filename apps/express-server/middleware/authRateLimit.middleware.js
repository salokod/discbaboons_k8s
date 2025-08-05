import rateLimit from 'express-rate-limit';

// Skip rate limiting in test environment
const skipRateLimit = process.env.NODE_ENV === 'test';

// Enhanced logging for security monitoring
const createRateLimitHandler = (rateLimitType) => (req, res, _next) => {
  // Log security violation
  if (!skipRateLimit) {
    console.warn(`[SECURITY] Rate limit exceeded: ${rateLimitType}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl,
    });
  }
  // Return standard rate limit response
  return res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
  });
};

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count both success and failed for complete picture
  skipFailedRequests: false, // Count failed requests to prevent retry attacks
  skip: () => skipRateLimit, // Skip rate limiting in test environment
  handler: createRateLimitHandler('auth_rate_limit'),
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
  skipSuccessfulRequests: false, // Track all password attempts for security
  skipFailedRequests: false, // Essential for password attack prevention
  skip: () => skipRateLimit, // Skip rate limiting in test environment
  handler: createRateLimitHandler('password_rate_limit'),
});

// Separate rate limiting for username recovery (less restrictive than password)
const usernameRecoveryRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // Limit each IP to 5 username recovery attempts per 30 minutes
  message: {
    success: false,
    message: 'Too many username recovery attempts, please try again in 30 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Monitor all username recovery attempts
  skipFailedRequests: false, // Track failed attempts to prevent enumeration
  skip: () => skipRateLimit, // Skip rate limiting in test environment
  handler: createRateLimitHandler('username_recovery_rate_limit'),
});

// Enhanced brute force protection for login attempts
// More aggressive rate limiting that kicks in after basic rate limit
const loginBruteForceProtection = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Allow up to 10 total login attempts per IP per hour
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts
  skipFailedRequests: false, // Track all failed attempts
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('login_brute_force_protection'),
});

export {
  authRateLimit, passwordRateLimit, usernameRecoveryRateLimit, loginBruteForceProtection,
};
