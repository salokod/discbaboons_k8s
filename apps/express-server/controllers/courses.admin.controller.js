import coursesAdminService from '../services/courses.admin.service.js';

const listPendingController = async (req, res, next) => {
  try {
    const filters = {
      limit: req.query.limit,
      offset: req.query.offset,
    };

    const result = await coursesAdminService.listPending(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const approveController = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const { approved, adminNotes } = req.body;
    const adminUserId = req.user.userId;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Approved status must be true or false' });
    }

    const result = await coursesAdminService.approve(courseId, approved, adminNotes, adminUserId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const coursesAdminController = {
  listPending: listPendingController,
  approve: approveController,
};

export default coursesAdminController;
