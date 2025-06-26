import listDiscsService from '../services/discs.list.service.js';

const discsListController = async (req, res, next) => {
  try {
    const discs = await listDiscsService(req.query);
    res.json(discs);
  } catch (err) {
    next(err);
  }
};

export default discsListController;
