import coursesGetService from '../services/courses.get.service.js';

const coursesGetController = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    // Get userId from authenticated request (if available)
    const userId = req.user?.userId || null;
    const course = await coursesGetService(courseId, userId);
    res.json(course);
  } catch (error) {
    next(error);
  }
};

export default coursesGetController;
