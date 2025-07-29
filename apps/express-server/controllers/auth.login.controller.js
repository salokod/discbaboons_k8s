import loginUser from '../services/auth.login.service.js';

const loginController = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json(result);
  } catch (error) {
    // Pass all errors to global error handler for consistency
    return next(error);
  }
};

export default loginController;
