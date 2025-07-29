import coursesEditService from '../services/courses.edit.service.js';

const editController = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user?.userId;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Extract update data from request body
    const updateData = {
      name: req.body.name,
      city: req.body.city,
      state_province: req.body.stateProvince || req.body.state_province,
      country: req.body.country,
      postal_code: req.body.postalCode || req.body.postal_code,
      hole_count: req.body.holeCount || req.body.hole_count,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const result = await coursesEditService.edit(courseId, updateData, userId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export default editController;
