import getParsService from '../services/rounds.getPars.service.js';

const getParsController = async (req, res, next) => {
  try {
    const roundId = req.params.id;
    const { userId } = req.user;

    const pars = await getParsService(roundId, userId);
    res.json(pars);
  } catch (error) {
    next(error);
  }
};

export default getParsController;
