import coursesSearchService from '../services/courses.search.service.js';

const coursesSearchController = async (req, res, next) => {
  try {
    const filters = {
      state: req.query.state,
      city: req.query.city,
      name: req.query.name,
    };

    const courses = await coursesSearchService(filters);
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

export default coursesSearchController;
