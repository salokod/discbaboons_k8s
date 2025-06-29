import express from 'express';
import bagsCreateController from '../controllers/bags.create.controller.js';
import bagsListController from '../controllers/bags.list.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/bags - List user's bags (requires authentication)
router.get('/', authenticateToken, bagsListController);

// POST /api/bags - Create a new bag (requires authentication)
router.post('/', authenticateToken, bagsCreateController);

export default router;
