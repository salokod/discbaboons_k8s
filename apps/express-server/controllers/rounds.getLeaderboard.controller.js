import getLeaderboardService from '../services/rounds.getLeaderboard.service.js';

const getLeaderboardController = async (req, res, next) => {
  try {
    const result = await getLeaderboardService(req.params.id, req.user.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default getLeaderboardController;
