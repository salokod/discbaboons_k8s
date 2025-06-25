// This file has been renamed. Please use controllers/discs.list.controller.js

import listDiscsService from '../services/discs.list.service.js';

const discmasterListController = async (req, res, next) => {
  try {
    const result = await listDiscsService(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export default discmasterListController;
