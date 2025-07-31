import express from 'express';
import discsListController from '../controllers/discs.list.controller.js';
import discsCreateController from '../controllers/discs.create.controller.js';
import discsApproveController from '../controllers/discs.approve.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import isAdmin from '../middleware/isadmin.middleware.js';
import { discsSearchRateLimit, discsSubmissionRateLimit, discsAdminRateLimit } from '../middleware/discsRateLimit.middleware.js';
import discsRequestLimit from '../middleware/discsRequestLimit.middleware.js';

const router = express.Router();

// Middleware to force approved=false for /pending
function forcePendingFilter(req, res, next) {
  req.query.approved = 'false';
  next();
}

// GET /api/discs/master - List discs (requires authentication)
router.get('/master', discsSearchRateLimit, authenticateToken, discsListController);

// POST /api/discs/master - Add new disc (requires authentication)
router.post('/master', discsSubmissionRateLimit, discsRequestLimit, authenticateToken, discsCreateController);

// GET /api/discs/pending - List pending discs (admin only)
router.get('/pending', discsAdminRateLimit, authenticateToken, isAdmin, forcePendingFilter, discsListController);

// PATCH /api/discs/:id/approve - Approve a pending disc (admin only)
router.patch('/:id/approve', discsAdminRateLimit, authenticateToken, isAdmin, discsApproveController);

export default router;
