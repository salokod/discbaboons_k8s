import searchProfilesService from '../services/profile.search.service.js';

const searchProfilesController = async (req, res, next) => {
  try {
    const results = await searchProfilesService(req.query);
    return res.status(200).json({ success: true, results });
  } catch (error) {
    return next(error);
  }
};

export default searchProfilesController;
