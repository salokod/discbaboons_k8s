import getRoundService from '../services/rounds.get.service.js';

const getRoundController = async (req, res, next) => {
  try {
    const result = await getRoundService(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default getRoundController;
