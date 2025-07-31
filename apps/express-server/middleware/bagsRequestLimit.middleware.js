// Request size limit middleware for bags endpoints
// Prevents large payload attacks while allowing reasonable bag data

const MAX_REQUEST_SIZE = 50 * 1024; // 50KB - generous for bag descriptions and multiple discs

const bagsRequestLimit = (req, res, next) => {
  const contentLength = req.headers['content-length'];

  // Allow requests without content-length header (will be handled by express body parser limits)
  if (!contentLength) {
    return next();
  }

  const size = parseInt(contentLength, 10);

  // Handle invalid content-length header gracefully
  if (Number.isNaN(size)) {
    return next();
  }

  if (size > MAX_REQUEST_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Maximum size is 50KB.',
    });
  }

  return next();
};

export default bagsRequestLimit;
