import express from 'express';
import roundsCreateController from '../controllers/rounds.create.controller.js';
import roundsListController from '../controllers/rounds.list.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/rounds - List user's rounds (requires authentication)
router.get('/', authenticateToken, roundsListController);

// POST /api/rounds - Create new round (requires authentication)
router.post('/', authenticateToken, roundsCreateController);

export default router;
