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
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export default authenticateToken;
