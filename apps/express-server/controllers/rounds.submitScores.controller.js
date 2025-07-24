import submitScoresService from '../services/rounds.submitScores.service.js';

const submitScoresController = async (req, res, next) => {
  try {
    const { id: roundId } = req.params;
    const { scores } = req.body;
    const { userId } = req.user;

    const result = await submitScoresService(roundId, scores, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default submitScoresController;
