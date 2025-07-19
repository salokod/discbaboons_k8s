import coursesSearchService from '../services/courses.search.service.js';

const coursesSearchController = async (req, res, next) => {
  try {
    // Helper function to convert string query params to boolean
    const parseBoolean = (value) => {
      if (value === undefined || value === null) return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value; // Return as-is for validation to catch invalid values
    };

    const filters = {
      state: req.query.state,
      stateProvince: req.query.stateProvince,
      country: req.query.country,
      city: req.query.city,
      name: req.query.name,
      is_user_submitted: parseBoolean(req.query.is_user_submitted),
      approved: parseBoolean(req.query.approved),
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
