import getProfileService from '../services/profile.get.service.js';

const getProfileController = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  try {
    const result = await getProfileService(req.user);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export default getProfileController;
