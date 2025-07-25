import getScoresService from '../services/rounds.getScores.service.js';

const getScoresController = async (req, res, next) => {
  try {
    const result = await getScoresService(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default getScoresController;
