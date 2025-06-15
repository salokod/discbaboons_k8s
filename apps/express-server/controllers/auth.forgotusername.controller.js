import forgotUsernameService from '../services/auth.forgotusername.service.js';

const forgotUsernameController = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await forgotUsernameService(email);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default forgotUsernameController;
