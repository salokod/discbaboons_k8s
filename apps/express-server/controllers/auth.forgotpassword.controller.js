import forgotPasswordService from '../services/auth.forgotpassword.service.js';

const forgotPasswordController = async (req, res, next) => {
  try {
    const result = await forgotPasswordService();

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default forgotPasswordController;
