import bulkRecoverDiscsService from '../services/bag-contents.bulk-recover.service.js';

const bagContentsBulkRecoverController = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { content_ids: contentIds, bag_id: bagId } = req.body;

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

    if (!bagId) {
      return res.status(400).json({
        success: false,
        message: 'bag_id is required',
      });
    }

    const result = await bulkRecoverDiscsService(userId, contentIds, bagId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

export default bagContentsBulkRecoverController;
