import updateRoundService from '../services/rounds.update.service.js';
import errorHandler from '../middleware/errorHandler.js';

const updateRoundController = async (req, res, next) => {
  try {
    const { id: roundId } = req.params;
    const updateData = req.body;
    const { userId } = req.user;

    const updatedRound = await updateRoundService(roundId, updateData, userId);

    res.status(200).json({
      success: true,
      data: updatedRound,
    });
  } catch (error) {
    errorHandler(error, req, res, next);
  }
};

export default updateRoundController;
