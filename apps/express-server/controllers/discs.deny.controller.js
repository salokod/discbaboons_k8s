// apps/express-server/controllers/discs.deny.controller.js
// Controller for denying disc submissions
import denyDiscService from '../services/discs.deny.service.js';

const discsDenyController = async (req, res, next) => {
  try {
    const disc = await denyDiscService(req.params.id, req.body.reason, req.user.userId);
    res.json({
      success: true,
      disc,
    });
  } catch (err) {
    next(err);
  }
};

export default discsDenyController;
