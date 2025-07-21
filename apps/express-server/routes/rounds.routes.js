import express from 'express';
import roundsCreateController from '../controllers/rounds.create.controller.js';
import roundsListController from '../controllers/rounds.list.controller.js';
import addPlayerController from '../controllers/rounds.addPlayer.controller.js';
import listPlayersController from '../controllers/rounds.listPlayers.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/rounds - List user's rounds (requires authentication)
router.get('/', authenticateToken, roundsListController);

// POST /api/rounds - Create new round (requires authentication)
router.post('/', authenticateToken, roundsCreateController);

// POST /api/rounds/:id/players - Add player to round (requires authentication)
router.post('/:id/players', authenticateToken, addPlayerController);

// GET /api/rounds/:id/players - List round players (requires authentication)
router.get('/:id/players', authenticateToken, listPlayersController);

export default router;
