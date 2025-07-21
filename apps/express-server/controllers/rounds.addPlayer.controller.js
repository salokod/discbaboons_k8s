import { addPlayerToRound } from '../services/rounds.addPlayer.service.js';

const addPlayerController = async (req, res, next) => {
  const { id: roundId } = req.params;
  const { userId, guestName } = req.body;
  const requestingUserId = req.user.userId;

  if (!roundId) {
    return res.status(400).json({
      success: false,
      message: 'Round ID is required',
    });
  }

  try {
    const playerData = userId ? { userId } : { guestName };
    const result = await addPlayerToRound(roundId, playerData, requestingUserId);

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export default addPlayerController;
