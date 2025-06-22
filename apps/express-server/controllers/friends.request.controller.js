import friendsRequestService from '../services/friends.request.service.js';

const friendsRequestController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  try {
    const result = await friendsRequestService(req.user.userId, req.body.recipientId);
    return res.status(200).json(result);
  } catch (err) {
    return next(err); // <-- Add return here
  }
};

export default friendsRequestController;
