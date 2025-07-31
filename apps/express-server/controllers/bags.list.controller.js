import listBagsService from '../services/bags.list.service.js';

const bagsListController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const filters = req.query;

    const result = await listBagsService(userId, filters);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

export default bagsListController;
