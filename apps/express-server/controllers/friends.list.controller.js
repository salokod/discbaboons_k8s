import getFriendsListService from '../services/friends.list.service.js';

const friendsListController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  try {
    const friends = await getFriendsListService(req.user.userId);
    return res.status(200).json({
      success: true,
      friends,
    });
  } catch (err) {
    return next(err);
  }
};

export default friendsListController;
