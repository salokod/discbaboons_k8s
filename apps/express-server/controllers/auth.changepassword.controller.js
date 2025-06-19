import changePasswordService from '../services/auth.changepassword.service.js';

const changePasswordController = async (req, res, next) => {
  try {
    const result = await changePasswordService(req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default changePasswordController;
