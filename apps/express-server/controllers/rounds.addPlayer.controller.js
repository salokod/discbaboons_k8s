import { addPlayerToRound } from '../services/rounds.addPlayer.service.js';

const addPlayerController = async (req, res, next) => {
  const { id: roundId } = req.params;
  const { players } = req.body;
  const requestingUserId = req.user.userId;

  if (!roundId) {
    return res.status(400).json({
      success: false,
      message: 'Round ID is required',
    });
  }

  if (!players || !Array.isArray(players) || players.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Players array is required and must contain at least one player',
    });
  }

  try {
    const result = await addPlayerToRound(roundId, players, requestingUserId);

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export default addPlayerController;
