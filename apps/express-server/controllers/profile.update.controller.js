import updateProfileService from '../services/profile.update.service.js';

const updateProfileController = async (req, res, next) => {
  const userId = req.user?.userId;
  const updateData = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    const result = await updateProfileService(userId, updateData);
    return res.status(200).json(result);
  } catch (error) {
    return next(error); // Pass error to centralized error handler
  }
};

export default updateProfileController;
