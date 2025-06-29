import getBagService from '../services/bags.get.service.js';

const getBagController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: bagId } = req.params;

    const bag = await getBagService(userId, bagId);

    if (!bag) {
      return res.status(404).json({
        success: false,
        message: 'Bag not found',
      });
    }

    return res.status(200).json({ success: true, bag });
  } catch (err) {
    return next(err);
  }
};

export default getBagController;
