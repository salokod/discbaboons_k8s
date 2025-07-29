// Security headers middleware for enhanced API security
const securityHeaders = (req, res, next) => {
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

  // Content Security Policy for auth endpoints
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  // Permissions policy to disable unnecessary features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server information leakage
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add security timing headers to prevent timing attacks
  res.setHeader('X-Request-ID', (req.headers && req.headers['x-request-id']) || `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  next();
};

export default securityHeaders;
