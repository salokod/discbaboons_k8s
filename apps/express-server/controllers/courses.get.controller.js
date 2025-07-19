import coursesGetService from '../services/courses.get.service.js';

const coursesGetController = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await coursesGetService(courseId);
    res.json(course);
  } catch (error) {
    next(error);
  }
};

export default coursesGetController;
