import loginUser from '../services/auth.login.service.js';

const loginController = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json(result);
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle authentication errors
    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Pass other errors to error middleware
    return next(error);
  }
};

export default loginController;
