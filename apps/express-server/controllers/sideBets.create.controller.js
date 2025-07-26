import sideBetsCreateService from '../services/sideBets.create.service.js';

const sideBetsCreateController = async (req, res, next) => {
  try {
    const result = await sideBetsCreateService(req.body, req.params.id, req.user.userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export default sideBetsCreateController;
