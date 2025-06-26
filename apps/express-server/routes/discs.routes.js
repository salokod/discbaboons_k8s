import express from 'express';
import discsListController from '../controllers/discs.list.controller.js';
import discsCreateController from '../controllers/discs.create.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import isAdmin from '../middleware/isadmin.middleware.js';

const router = express.Router();

// Middleware to force approved=false for /pending
function forcePendingFilter(req, res, next) {
  req.query.approved = 'false';
  next();
}

// GET /api/discs/master - List discs (requires authentication)
router.get('/master', authenticateToken, discsListController);

// POST /api/discs/master - Add new disc (requires authentication)
router.post('/master', authenticateToken, discsCreateController);

// GET /api/discs/pending - List pending discs (admin only)
router.get('/pending', authenticateToken, isAdmin, forcePendingFilter, discsListController);

export default router;
