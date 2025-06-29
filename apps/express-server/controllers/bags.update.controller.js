import updateBagService from '../services/bags.update.service.js';

const updateBagController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: bagId } = req.params;
    const updateData = req.body;

    const updatedBag = await updateBagService(userId, bagId, updateData);

    if (!updatedBag) {
      return res.status(404).json({
        success: false,
        message: 'Bag not found',
      });
    }

    return res.status(200).json({
      success: true,
      bag: updatedBag,
    });
  } catch (err) {
    return next(err);
  }
};

export default updateBagController;
