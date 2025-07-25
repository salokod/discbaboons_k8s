import express from 'express';
import roundsCreateController from '../controllers/rounds.create.controller.js';
import roundsListController from '../controllers/rounds.list.controller.js';
import getRoundController from '../controllers/rounds.get.controller.js';
import addPlayerController from '../controllers/rounds.addPlayer.controller.js';
import listPlayersController from '../controllers/rounds.listPlayers.controller.js';
import removePlayerController from '../controllers/rounds.removePlayer.controller.js';
import updateRoundController from '../controllers/rounds.update.controller.js';
import deleteRoundController from '../controllers/rounds.delete.controller.js';
import setParController from '../controllers/rounds.setPar.controller.js';
import getParsController from '../controllers/rounds.getPars.controller.js';
import submitScoresController from '../controllers/rounds.submitScores.controller.js';
import getScoresController from '../controllers/rounds.getScores.controller.js';
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

// DELETE /api/rounds/:id/players/:playerId - Remove player from round (requires authentication)
router.delete('/:id/players/:playerId', authenticateToken, removePlayerController);

// PUT /api/rounds/:id/holes/:holeNumber/par - Set hole par (requires authentication)
router.put('/:id/holes/:holeNumber/par', authenticateToken, setParController);

// GET /api/rounds/:id/pars - Get all pars for a round (requires authentication)
router.get('/:id/pars', authenticateToken, getParsController);

// POST /api/rounds/:id/scores - Submit scores for round (requires authentication)
router.post('/:id/scores', authenticateToken, submitScoresController);

// GET /api/rounds/:id/scores - Get all scores for round (requires authentication)
router.get('/:id/scores', authenticateToken, getScoresController);

// PUT /api/rounds/:id - Update round details (requires authentication)
router.put('/:id', authenticateToken, updateRoundController);

// DELETE /api/rounds/:id - Delete round (requires authentication)
router.delete('/:id', authenticateToken, deleteRoundController);

// GET /api/rounds/:id - Get round details (requires authentication)
router.get('/:id', authenticateToken, getRoundController);

export default router;
