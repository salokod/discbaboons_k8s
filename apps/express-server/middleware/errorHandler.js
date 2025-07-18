// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Validation errors (client-side issues)
  console.log('this be the err', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Authorization errors (forbidden)
  if (err.name === 'AuthorizationError') {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Not found errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }

  // Custom error with status (like 409 Conflict)
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Default 500 error (database issues, unexpected errors)
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
};

export default errorHandler;
