import coursesSearchService from '../services/courses.search.service.js';

const coursesSearchController = async (req, res, next) => {
  try {
    const filters = {
      state: req.query.state,
      stateProvince: req.query.stateProvince,
      country: req.query.country,
      city: req.query.city,
      name: req.query.name,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    // Get userId from authenticated request (if available)
    const userId = req.user?.userId || null;

    const result = await coursesSearchService(filters, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default coursesSearchController;
