import getFriendBagService from '../services/bags.friends.get.service.js';

const getFriendBagController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { friendUserId, bagId } = req.params;

    // Validate friendUserId is a valid integer
    const friendUserIdInt = parseInt(friendUserId, 10);
    if (Number.isNaN(friendUserIdInt) || friendUserIdInt.toString() !== friendUserId) {
      const error = new Error('friendUserId must be a valid integer');
      error.name = 'ValidationError';
      throw error;
    }

    const result = await getFriendBagService(userId, friendUserIdInt, bagId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export default getFriendBagController;
