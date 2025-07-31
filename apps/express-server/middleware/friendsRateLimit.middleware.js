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

// Rate limiting for friend requests (prevent spam)
const friendRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 friend requests per hour per IP
  message: {
    success: false,
    message: 'Too many friend requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('friend_request_rate_limit'),
});

// Rate limiting for friend responses (more generous)
const friendRespondRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 responses per hour per IP
  message: {
    success: false,
    message: 'Too many friend responses, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('friend_respond_rate_limit'),
});

// Rate limiting for friends list operations
const friendsListRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many friend list requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('friends_list_rate_limit'),
});

export {
  friendRequestRateLimit,
  friendRespondRateLimit,
  friendsListRateLimit,
};
