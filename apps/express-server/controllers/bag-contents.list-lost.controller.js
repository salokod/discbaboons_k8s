import listLostDiscsService from '../services/bag-contents.list-lost.service.js';

const listLostDiscsController = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Parse query parameters
    const options = {};
    if (req.query.limit) options.limit = parseInt(req.query.limit, 10);
    if (req.query.offset) options.offset = parseInt(req.query.offset, 10);
    if (req.query.sort) options.sort = req.query.sort;
    if (req.query.order) options.order = req.query.order;

    // Call service
    const result = await listLostDiscsService(userId, options);

    // Return success response
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export default listLostDiscsController;
