import getProfileService from '../services/profile.get.service.js';

const getProfileController = async (req, res) => {
  // Check if user is authenticated (JWT middleware should have set req.user)
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
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default getProfileController;
