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

// Rate limiting for course search (public-facing, more restrictive)
const courseSearchRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 searches per 5 minutes per IP
  message: {
    success: false,
    message: 'Too many search requests, please try again in 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('course_search_rate_limit'),
});

// Rate limiting for course submission (prevent spam)
const courseSubmitRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 course submissions per hour per IP
  message: {
    success: false,
    message: 'Too many course submissions, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('course_submit_rate_limit'),
});

// Rate limiting for course editing (moderate restriction)
const courseEditRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 edits per 15 minutes per IP
  message: {
    success: false,
    message: 'Too many edit requests, please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('course_edit_rate_limit'),
});

// Rate limiting for admin actions (very restrictive)
const courseAdminRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 admin actions per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many admin requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('course_admin_rate_limit'),
});

export {
  courseSearchRateLimit,
  courseSubmitRateLimit,
  courseEditRateLimit,
  courseAdminRateLimit,
};
