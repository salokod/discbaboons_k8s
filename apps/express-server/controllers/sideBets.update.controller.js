import sideBetsUpdateService from '../services/sideBets.update.service.js';

const sideBetsUpdateController = async (req, res) => {
  const { betId, id: roundId } = req.params;
  const { userId } = req.user;
  const updateData = req.body;

  const result = await sideBetsUpdateService(betId, roundId, userId, updateData);
  res.json(result);
};

export default sideBetsUpdateController;
