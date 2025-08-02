import roundsCompleteService from '../services/rounds.complete.service.js';

const roundsCompleteController = async (req, res) => {
  const { id: roundId } = req.params;
  const { userId } = req.user;

  const result = await roundsCompleteService(roundId, userId);
  res.json(result);
};

export default roundsCompleteController;
