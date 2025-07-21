import listPlayersService from '../services/rounds.listPlayers.service.js';

const listPlayersController = async (req, res, next) => {
  try {
    const players = await listPlayersService(req.params.id, req.user.userId);
    res.json(players);
  } catch (error) {
    next(error);
  }
};

export default listPlayersController;
