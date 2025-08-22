import bulkMarkDiscLostService from '../services/bag-contents.bulk-mark-lost.service.js';

const bagContentsBulkMarkLostController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { content_ids: contentIds, lost_notes: lostNotes } = req.body;

    // Validate required fields at controller level
    if (!contentIds) {
      return res.status(400).json({
        success: false,
        message: 'content_ids is required',
      });
    }

    if (!Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'content_ids must be an array',
      });
    }

    if (contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'content_ids cannot be empty',
      });
    }

    // Validate lost_notes if provided
    if (lostNotes !== undefined && lostNotes !== null && typeof lostNotes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'lost_notes must be a string if provided',
      });
    }

    if (lostNotes && lostNotes.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'lost_notes cannot exceed 500 characters',
      });
    }

    const result = await bulkMarkDiscLostService(userId, contentIds, {
      lost_notes: lostNotes,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

export default bagContentsBulkMarkLostController;
