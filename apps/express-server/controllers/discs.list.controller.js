import listDiscsService from '../services/discs.list.service.js';

const discsListController = async (req, res, next) => {
  try {
    const result = await listDiscsService(req.query);
    res.json({
      success: true,
      discs: result.discs,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default discsListController;
