import deleteRoundService from '../services/rounds.delete.service.js';
import errorHandler from '../middleware/errorHandler.js';

const deleteRoundController = async (req, res, next) => {
  try {
    const { id: roundId } = req.params;
    const { userId } = req.user;

    const result = await deleteRoundService(roundId, userId);

    res.status(200).json(result);
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};

export default deleteRoundController;