import getFriendsListService from '../services/friends.list.service.js';
import { validateFriendsQueryParams } from '../lib/validation.js';

const friendsListController = async (req, res, next) => {
  try {
    // Validate authenticated user has userId (should be handled by auth middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    // Validate query parameters to prevent 500 errors
    const validatedQuery = validateFriendsQueryParams(req.query);

    const result = await getFriendsListService(req.user.userId, validatedQuery);

    return res.status(200).json({
      success: true,
      ...result, // Spreads friends and pagination properties
    });
  } catch (err) {
    // Handle validation errors with 400 status instead of 500
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
        field: err.field || null,
      });
    }
    return next(err);
  }
};

export default friendsListController;
