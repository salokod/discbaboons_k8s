import loginUser from '../services/auth.login.service.js';

const loginController = async (req, res, next) => {
  try {

    const result = await loginUser(req.body);

    return res.status(200).json(result);
  } catch (error) {


    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.log('✅ Handling ValidationError with 400 status');
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle authentication errors
    if (error.status === 401) {
      console.log('✅ Handling AuthError with 401 status');
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    // Pass other errors to error middleware
    console.log('❌ Passing unexpected error to middleware:', error.message);
    return next(error);
  }
};

export default loginController;
