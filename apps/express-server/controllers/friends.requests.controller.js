import getFriendRequestsService from '../services/friends.requests.service.js';

const friendsRequestsController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  try {
    const { type } = req.query;
    const requests = await getFriendRequestsService(req.user.userId, type);
    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    return next(err);
  }
};

export default friendsRequestsController;
