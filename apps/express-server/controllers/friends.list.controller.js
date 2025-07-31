import getFriendsListService from '../services/friends.list.service.js';

const friendsListController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const filters = req.query;

    const result = await getFriendsListService(userId, filters);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

export default friendsListController;
