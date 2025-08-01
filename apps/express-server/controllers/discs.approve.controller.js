import approveDiscService from '../services/discs.approve.service.js';

const discsApproveController = async (req, res, next) => {
  try {
    const disc = await approveDiscService(req.params.id);
    res.json({
      success: true,
      disc,
    });
  } catch (err) {
    next(err);
  }
};

export default discsApproveController;
