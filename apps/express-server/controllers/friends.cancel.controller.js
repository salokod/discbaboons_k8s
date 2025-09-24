import cancelFriendRequestService from '../services/friends.cancel.service.js';

const friendsCancelController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    const requestId = parseInt(req.params.id, 10);

    if (!requestId || Number.isNaN(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID',
      });
    }

    const canceledRequest = await cancelFriendRequestService(req.user.userId, requestId);

    return res.status(200).json({
      success: true,
      request: canceledRequest,
    });
  } catch (err) {
    return next(err);
  }
};

export default friendsCancelController;
