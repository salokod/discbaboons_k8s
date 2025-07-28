import sideBetsGetService from '../services/sideBets.get.service.js';

const sideBetsGetController = async (req, res, next) => {
  try {
    const { betId, id: roundId } = req.params;
    const { userId } = req.user;

    const bet = await sideBetsGetService(betId, roundId, userId);

    res.status(200).json(bet);
  } catch (error) {
    next(error);
  }
};

export default sideBetsGetController;
