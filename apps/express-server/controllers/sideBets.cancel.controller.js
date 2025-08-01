import sideBetsCancelService from '../services/sideBets.cancel.service.js';

const sideBetsCancelController = async (req, res) => {
  const { betId, id: roundId } = req.params;
  const { userId } = req.user;

  const result = await sideBetsCancelService(betId, roundId, userId);
  res.json(result);
};

export default sideBetsCancelController;
