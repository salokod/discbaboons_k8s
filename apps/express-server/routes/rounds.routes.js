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
import getLeaderboardController from '../controllers/rounds.getLeaderboard.controller.js';
import skinsCalculateController from '../controllers/skins.calculate.controller.js';
import sideBetsCreateController from '../controllers/sideBets.create.controller.js';
import sideBetsListController from '../controllers/sideBets.list.controller.js';
import sideBetsGetController from '../controllers/sideBets.get.controller.js';
import sideBetsUpdateController from '../controllers/sideBets.update.controller.js';
import sideBetsCancelController from '../controllers/sideBets.cancel.controller.js';
import sideBetsSuggestionsController from '../controllers/sideBets.suggestions.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import {
  roundsListRateLimit,
  roundsCreateRateLimit,
  roundsDetailsRateLimit,
  roundsUpdateRateLimit,
  roundsDeleteRateLimit,
  roundsPlayerRateLimit,
  roundsScoringRateLimit,
  roundsSideBetsRateLimit,
} from '../middleware/roundsRateLimit.middleware.js';
import {
  roundsRequestLimit,
  roundsScoringRequestLimit,
} from '../middleware/roundsRequestLimit.middleware.js';

const router = express.Router();

// GET /api/rounds - List user's rounds (requires authentication)
router.get('/', roundsListRateLimit, authenticateToken, roundsListController);

// POST /api/rounds - Create new round (requires authentication)
router.post('/', roundsCreateRateLimit, roundsRequestLimit, authenticateToken, roundsCreateController);

// POST /api/rounds/:id/players - Add player to round (requires authentication)
router.post('/:id/players', roundsPlayerRateLimit, roundsRequestLimit, authenticateToken, addPlayerController);

// GET /api/rounds/:id/players - List round players (requires authentication)
router.get('/:id/players', roundsPlayerRateLimit, authenticateToken, listPlayersController);

// DELETE /api/rounds/:id/players/:playerId - Remove player from round (requires authentication)
router.delete('/:id/players/:playerId', roundsPlayerRateLimit, authenticateToken, removePlayerController);

// PUT /api/rounds/:id/holes/:holeNumber/par - Set hole par (requires authentication)
router.put('/:id/holes/:holeNumber/par', roundsScoringRateLimit, roundsRequestLimit, authenticateToken, setParController);

// GET /api/rounds/:id/pars - Get all pars for a round (requires authentication)
router.get('/:id/pars', roundsScoringRateLimit, authenticateToken, getParsController);

// POST /api/rounds/:id/scores - Submit scores for round (requires authentication)
router.post('/:id/scores', roundsScoringRateLimit, roundsScoringRequestLimit, authenticateToken, submitScoresController);

// GET /api/rounds/:id/scores - Get all scores for round (requires authentication)
router.get('/:id/scores', roundsScoringRateLimit, authenticateToken, getScoresController);

// GET /api/rounds/:id/leaderboard - Get round leaderboard (requires authentication)
router.get('/:id/leaderboard', roundsScoringRateLimit, authenticateToken, getLeaderboardController);

// GET /api/rounds/:id/skins - Get round skins calculation (requires authentication)
router.get('/:id/skins', roundsScoringRateLimit, authenticateToken, skinsCalculateController);

// GET /api/rounds/:id/side-bets/suggestions - Get side bet suggestions (requires authentication)
router.get('/:id/side-bets/suggestions', roundsSideBetsRateLimit, authenticateToken, sideBetsSuggestionsController);

// POST /api/rounds/:id/side-bets - Create side bet for round (requires authentication)
router.post('/:id/side-bets', roundsSideBetsRateLimit, roundsRequestLimit, authenticateToken, sideBetsCreateController);

// GET /api/rounds/:id/side-bets - List side bets for round (requires authentication)
router.get('/:id/side-bets', roundsSideBetsRateLimit, authenticateToken, sideBetsListController);

// GET /api/rounds/:id/side-bets/:betId - Get single side bet (requires authentication)
router.get('/:id/side-bets/:betId', roundsSideBetsRateLimit, authenticateToken, sideBetsGetController);

// PUT /api/rounds/:id/side-bets/:betId - Update side bet (requires authentication)
router.put('/:id/side-bets/:betId', roundsSideBetsRateLimit, roundsRequestLimit, authenticateToken, sideBetsUpdateController);

// DELETE /api/rounds/:id/side-bets/:betId - Cancel side bet (requires authentication)
router.delete('/:id/side-bets/:betId', roundsSideBetsRateLimit, authenticateToken, sideBetsCancelController);

// IMPORTANT: General routes MUST come after specific patterns to avoid matching conflicts
// PUT /api/rounds/:id - Update round details (requires authentication)
router.put('/:id', roundsUpdateRateLimit, roundsRequestLimit, authenticateToken, updateRoundController);

// DELETE /api/rounds/:id - Delete round (requires authentication)
router.delete('/:id', roundsDeleteRateLimit, authenticateToken, deleteRoundController);

// GET /api/rounds/:id - Get round details (requires authentication)
router.get('/:id', roundsDetailsRateLimit, authenticateToken, getRoundController);

export default router;
