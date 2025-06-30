import addToBagService from '../services/bag-contents.add.service.js';

const bagContentsAddController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { id: bagId } = req.params;
    const discData = req.body;
    const bagContent = await addToBagService(userId, bagId, discData);
    res.status(201).json({ success: true, bag_content: bagContent });
  } catch (err) {
    next(err);
  }
};

export default bagContentsAddController;
