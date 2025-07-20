import roundsListService from '../services/rounds.list.service.js';

const roundsListController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const filters = req.query;

    const result = await roundsListService(userId, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default roundsListController;
