import respondToFriendRequestService from '../services/friends.respond.service.js';

const friendsRespondController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  try {
    const { requestId, action } = req.body;
    const updatedRequest = await respondToFriendRequestService(requestId, req.user.userId, action);
    return res.status(200).json({
      success: true,
      request: updatedRequest,
    });
  } catch (err) {
    return next(err);
  }
};

export default friendsRespondController;
