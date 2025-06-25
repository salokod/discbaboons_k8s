// This file has been renamed. Please use controllers/discs.list.controller.js

import listDiscsService from '../services/discs.list.service.js';

const discsListController = async (req, res, next) => {
  try {
    const result = await listDiscsService(req.query);
    res.json(result);
  } catch (err) {
    console.error('Discs controller error:', err); // Add this line
    next(err);
  }
};

export default discsListController;
