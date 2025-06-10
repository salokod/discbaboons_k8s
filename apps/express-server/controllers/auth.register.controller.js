import registerUser from '../services/auth.register.service.js';

const registerController = async (req, res, next) => {
  try {
    // Call the service with request body
    const result = await registerUser(req.body);

    // Return success response
    res.status(201).json(result);
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

export default registerController;
