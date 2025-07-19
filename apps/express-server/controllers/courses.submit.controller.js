import coursesSubmitService from '../services/courses.submit.service.js';

const coursesSubmitController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const courseData = req.body;

    const result = await coursesSubmitService(userId, courseData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export default coursesSubmitController;