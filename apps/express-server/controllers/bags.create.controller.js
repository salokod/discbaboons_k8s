import createBagService from '../services/bags.create.service.js';

const bagsCreateController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const bagData = req.body;

    const bag = await createBagService(userId, bagData);
    return res.status(201).json({ success: true, bag });
  } catch (error) {
    return next(error);
  }
};

export default bagsCreateController;
