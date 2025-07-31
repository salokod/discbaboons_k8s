import getFriendsListService from '../services/friends.list.service.js';

const friendsListController = async (req, res, next) => {
  try {
    // Extract pagination parameters from query string
    const { limit, offset } = req.query;

    const result = await getFriendsListService(req.user.userId, { limit, offset });

    return res.status(200).json({
      success: true,
      ...result, // Spreads friends and pagination properties
    });
  } catch (err) {
    return next(err);
  }
};

export default friendsListController;
