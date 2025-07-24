import setParService from '../services/rounds.setPar.service.js';

const setParController = async (req, res, next) => {
  try {
    const { id: roundId, holeNumber } = req.params;
    const { par } = req.body;
    const { userId } = req.user;

    const result = await setParService(roundId, parseInt(holeNumber, 10), par, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default setParController;
