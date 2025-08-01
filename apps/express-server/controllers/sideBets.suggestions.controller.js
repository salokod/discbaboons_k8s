import sideBetsSuggestionsService from '../services/sideBets.suggestions.service.js';

const sideBetsSuggestionsController = async (req, res, next) => {
  try {
    const { id: roundId } = req.params;
    const { userId } = req.user;

    const result = await sideBetsSuggestionsService(roundId, userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default sideBetsSuggestionsController;
