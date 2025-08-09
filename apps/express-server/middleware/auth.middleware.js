import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  // Check for authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  // Check for Bearer token format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization header format',
    });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.substring(7);

  // Verify JWT token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Basic JWT payload validation
    if (!decoded.userId) {
      const error = new Error('Token payload is missing required userId field');
      error.name = 'ValidationError';
      throw error;
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin || false,
    };

    return next();
  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(401).json({
        success: false,
        message: `Token validation failed: ${error.message}`,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export default authenticateToken;
