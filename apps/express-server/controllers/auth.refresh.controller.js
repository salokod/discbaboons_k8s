import refreshTokenService from '../services/auth.refresh.service.js';

const refreshController = async (req, res, next) => {
  try {
    const result = await refreshTokenService(req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default refreshController;
