import roundsCreateService from '../services/rounds.create.service.js';

const roundsCreateController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const roundData = req.body;

    const result = await roundsCreateService(roundData, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export default roundsCreateController;
