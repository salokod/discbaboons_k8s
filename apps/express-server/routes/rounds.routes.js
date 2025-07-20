import express from 'express';
import roundsCreateController from '../controllers/rounds.create.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/rounds - Create new round (requires authentication)
router.post('/', authenticateToken, roundsCreateController);

export default router;
