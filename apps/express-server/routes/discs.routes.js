import express from 'express';
import discsListController from '../controllers/discs.list.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/discs/master - List discs (requires authentication)
router.get('/master', authenticateToken, discsListController);

export default router;
