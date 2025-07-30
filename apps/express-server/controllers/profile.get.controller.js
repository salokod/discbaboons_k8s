import getProfileService from '../services/profile.get.service.js';

const getProfileController = async (req, res, next) => {
  try {
    const result = await getProfileService(req.user);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export default getProfileController;
