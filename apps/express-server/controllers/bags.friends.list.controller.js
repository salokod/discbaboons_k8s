import listFriendBagsService from '../services/bags.friends.list.service.js';

const bagsFriendsListController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { friendUserId } = req.params;

    // Validate friendUserId is a valid integer
    const friendUserIdInt = parseInt(friendUserId, 10);
    if (Number.isNaN(friendUserIdInt) || friendUserIdInt.toString() !== friendUserId) {
      const error = new Error('friendUserId must be a valid integer');
      error.name = 'ValidationError';
      throw error;
    }

    // Call service to get friend's bags
    const result = await listFriendBagsService(userId, friendUserIdInt);

    // Return success response
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export default bagsFriendsListController;
