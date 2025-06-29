import deleteBagService from '../services/bags.delete.service.js';

const deleteBagController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: bagId } = req.params;

    const deleted = await deleteBagService(userId, bagId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Bag not found',
      });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

export default deleteBagController;
