import friendsRequestService from '../services/friends.request.service.js';

const friendsRequestController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  try {
    const newRequest = await friendsRequestService(req.user.userId, req.body.recipientId);
    return res.status(201).json({
      success: true,
      request: newRequest,
    });
  } catch (err) {
    return next(err); // <-- Add return here
  }
};

export default friendsRequestController;
