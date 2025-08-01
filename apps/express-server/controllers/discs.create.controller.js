/* eslint-disable camelcase, no-underscore-dangle */

import createDiscService from '../services/discs.create.service.js';

const discsCreateController = async (req, res, next) => {
  try {
    // Assume req.user.userId is set by auth middleware
    const added_by_id = req.user?.userId;
    const discData = { ...req.body, added_by_id };
    const disc = await createDiscService(discData);
    res.status(201).json({
      success: true,
      disc,
    });
  } catch (err) {
    next(err);
  }
};

export default discsCreateController;
