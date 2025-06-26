import express from 'express';
import discsListController from '../controllers/discs.list.controller.js';
import discsCreateController from '../controllers/discs.create.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/discs/master - List discs (requires authentication)
router.get('/master', authenticateToken, discsListController);

// POST /api/discs/master - Add new disc (requires authentication)
router.post('/master', authenticateToken, discsCreateController);

export default router;
