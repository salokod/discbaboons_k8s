import sideBetsListService from '../services/sideBets.list.service.js';

const sideBetsListController = async (req, res, next) => {
  try {
    const { id: roundId } = req.params;
    const { userId } = req.user;

    const result = await sideBetsListService(roundId, userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default sideBetsListController;
