// Security headers middleware for enhanced API security
const securityHeaders = (_req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection (mainly for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent caching of sensitive auth responses (less aggressive for performance)
  res.setHeader('Cache-Control', 'no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Remove server information leakage
  res.removeHeader('X-Powered-By');

  next();
};

export default securityHeaders;
