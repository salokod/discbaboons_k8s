const discsRequestLimit = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  const MAX_SIZE = 5 * 1024; // 5KB

  if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Maximum size is 5KB.',
    });
  }

  return next();
};

export default discsRequestLimit;
