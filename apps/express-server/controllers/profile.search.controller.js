import searchProfilesService from '../services/profile.search.service.js';

const searchProfilesController = async (req, res, next) => {
  try {
    const result = await searchProfilesService(req.query);
    return res.status(200).json({
      success: true,
      profiles: result.profiles,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  } catch (error) {
    return next(error);
  }
};

export default searchProfilesController;
