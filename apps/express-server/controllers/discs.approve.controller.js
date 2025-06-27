import approveDiscService from '../services/discs.approve.service.js';

const discsApproveController = async (req, res, next) => {
  try {
    const approvedDisc = await approveDiscService(Number(req.params.id));
    res.json(approvedDisc);
  } catch (err) {
    next(err);
  }
};

export default discsApproveController;
