import markDiscLostService from '../services/bag-contents.mark-lost.service.js';

const bagContentsMarkLostController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { contentId } = req.params;
    const lostData = req.body;

    const updatedContent = await markDiscLostService(userId, contentId, lostData);

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: 'Bag content not found or access denied',
      });
    }

    return res.status(200).json({ success: true, bag_content: updatedContent });
  } catch (err) {
    return next(err);
  }
};

export default bagContentsMarkLostController;
