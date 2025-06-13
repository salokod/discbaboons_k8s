import loginUser from '../services/auth.login.service.js';

const loginController = async (req, res, next) => {
  try {
    console.log('🔍 Login controller called with body:', req.body);
    const result = await loginUser(req.body);
    console.log('✅ Login service returned:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Login controller error:', error.message);
    console.error('❌ Error name:', error.name);

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
