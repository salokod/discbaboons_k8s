import coursesSearchService from '../services/courses.search.service.js';

const coursesSearchController = async (req, res, next) => {
  try {
    const filters = {
      state: req.query.state,
      city: req.query.city,
      name: req.query.name,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    const result = await coursesSearchService(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export default coursesSearchController;
