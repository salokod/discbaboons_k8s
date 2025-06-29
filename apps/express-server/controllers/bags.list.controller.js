import listBagsService from '../services/bags.list.service.js';

const bagsListController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const result = await listBagsService(userId);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export default bagsListController;
