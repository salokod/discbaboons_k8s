import editBagContentService from '../services/bag-contents.edit.service.js';

const bagContentsEditController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: bagId, contentId } = req.params;
    const updateData = req.body;
    const updatedContent = await editBagContentService(userId, bagId, contentId, updateData);
    res.status(200).json({ success: true, bag_content: updatedContent });
  } catch (err) {
    next(err);
  }
};

export default bagContentsEditController;
