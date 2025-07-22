import removePlayerService from '../services/rounds.removePlayer.service.js';

const removePlayerController = async (req, res, next) => {
  try {
    const result = await removePlayerService(req.params.id, req.params.playerId, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default removePlayerController;
