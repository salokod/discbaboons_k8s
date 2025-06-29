import createBagService from '../services/bags.create.service.js';

const bagsCreateController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const bagData = req.body;
    const bag = await createBagService(userId, bagData);
    res.status(201).json({ success: true, bag });
  } catch (err) {
    next(err);
  }
};

export default bagsCreateController;
