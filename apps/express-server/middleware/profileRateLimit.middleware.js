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

// Rate limiting for profile GET (moderate usage)
const profileGetRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many profile requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('profile_get_rate_limit'),
});

// Rate limiting for profile updates (moderate restriction)
const profileUpdateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 updates per hour per IP
  message: {
    success: false,
    message: 'Too many profile update requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('profile_update_rate_limit'),
});

// Rate limiting for profile search (strict for public endpoint)
const profileSearchRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // 60 searches per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many profile search requests (limit: 60 per 10 minutes), please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('profile_search_rate_limit'),
});

export {
  profileGetRateLimit,
  profileUpdateRateLimit,
  profileSearchRateLimit,
};
