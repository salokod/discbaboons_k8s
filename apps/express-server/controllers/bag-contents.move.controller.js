import moveDiscService from '../services/bag-contents.move.service.js';

const moveDiscController = async (req, res, next, serviceFunction = moveDiscService) => {
  try {
    const { userId } = req.user;
    const { sourceBagId, targetBagId, contentIds } = req.body;

    const result = await serviceFunction(userId, sourceBagId, targetBagId, {
      contentIds,
    });

    if (result === null) {
      return res.status(404).json({
        success: false,
        message: 'Bags not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      movedCount: result.movedCount,
    });
  } catch (error) {
    return next(error);
  }
};

export default moveDiscController;
