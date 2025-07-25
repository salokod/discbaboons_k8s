import skinsCalculateService from '../services/skins.calculate.service.js';

const skinsCalculateController = async (req, res, next) => {
  try {
    const result = await skinsCalculateService(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default skinsCalculateController;
