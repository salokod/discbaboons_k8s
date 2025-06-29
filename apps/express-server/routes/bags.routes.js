import express from 'express';
import bagsCreateController from '../controllers/bags.create.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/bags - Create a new bag (requires authentication)
router.post('/', authenticateToken, bagsCreateController);

export default router;
