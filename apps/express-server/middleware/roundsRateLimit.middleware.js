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

// Rate limiting for rounds listing (moderate usage expected)
const roundsListRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 requests per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many rounds list requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_list_rate_limit'),
});

// Rate limiting for round creation (prevent spam)
const roundsCreateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 round creations per hour per IP
  message: {
    success: false,
    message: 'Too many round creation requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_create_rate_limit'),
});

// Rate limiting for round details (high usage during active play)
const roundsDetailsRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 requests per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many round detail requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_details_rate_limit'),
});

// Rate limiting for round updates (moderate restriction)
const roundsUpdateRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 updates per hour per IP
  message: {
    success: false,
    message: 'Too many round update requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_update_rate_limit'),
});

// Rate limiting for round deletion (very restrictive)
const roundsDeleteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 deletions per hour per IP
  message: {
    success: false,
    message: 'Too many round deletion requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_delete_rate_limit'),
});

// Rate limiting for player management (moderate usage)
const roundsPlayerRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // 30 player actions per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many player management requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_player_rate_limit'),
});

// Rate limiting for scoring operations (high usage during active play)
const roundsScoringRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // 100 scoring actions per 10 minutes per IP
  message: {
    success: false,
    message: 'Too many scoring requests, please try again in 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_scoring_rate_limit'),
});

// Rate limiting for side bets (moderate usage)
const roundsSideBetsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 side bet actions per hour per IP
  message: {
    success: false,
    message: 'Too many side bet requests, please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  skip: () => skipRateLimit,
  handler: createRateLimitHandler('rounds_side_bets_rate_limit'),
});

export {
  roundsListRateLimit,
  roundsCreateRateLimit,
  roundsDetailsRateLimit,
  roundsUpdateRateLimit,
  roundsDeleteRateLimit,
  roundsPlayerRateLimit,
  roundsScoringRateLimit,
  roundsSideBetsRateLimit,
};
