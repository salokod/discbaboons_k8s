/* eslint-disable camelcase */
import getBagService from '../services/bags.get.service.js';

const getBagController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: bagId } = req.params;
    const includeLost = req.query.include_lost === 'true';

    const bag = await getBagService(userId, bagId, includeLost);

    if (!bag) {
      return res.status(404).json({
        success: false,
        message: 'Bag not found',
      });
    }

    return res.status(200).json({ success: true, bag });
  } catch (error) {
    return next(error);
  }
};

export default getBagController;
