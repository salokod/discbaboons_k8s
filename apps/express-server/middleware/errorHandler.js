// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  const error = { ...err };
  error.message = err.message;

  // Validation errors (client-side issues)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Authorization errors (forbidden)
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  // Not found errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  // Custom error with status (like 409 Conflict)
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: error.message,
    });
  }

  // Default 500 error (database issues, unexpected errors)
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
};

export default errorHandler;
