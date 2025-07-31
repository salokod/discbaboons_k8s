import express from 'express';
import bagsCreateController from '../controllers/bags.create.controller.js';
import bagsListController from '../controllers/bags.list.controller.js';
import getBagController from '../controllers/bags.get.controller.js';
import updateBagController from '../controllers/bags.update.controller.js';
import deleteBagController from '../controllers/bags.delete.controller.js';
import bagContentsAddController from '../controllers/bag-contents.add.controller.js';
import bagContentsEditController from '../controllers/bag-contents.edit.controller.js';
import bagContentsMarkLostController from '../controllers/bag-contents.mark-lost.controller.js';
import listLostDiscsController from '../controllers/bag-contents.list-lost.controller.js';
import removeDiscController from '../controllers/bag-contents.remove.controller.js';
import moveDiscController from '../controllers/bag-contents.move.controller.js';
import bagsFriendsListController from '../controllers/bags.friends.list.controller.js';
import getFriendBagController from '../controllers/bags.friends.get.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import {
  bagsListRateLimit,
  bagsCreateRateLimit,
  bagsUpdateRateLimit,
  bagsDeleteRateLimit,
  bagsBulkRateLimit,
} from '../middleware/bagsRateLimit.middleware.js';
import bagsRequestLimit from '../middleware/bagsRequestLimit.middleware.js';

const router = express.Router();

// GET /api/bags - List user's bags (requires authentication)
router.get('/', bagsListRateLimit, authenticateToken, bagsListController);

// GET /api/bags/lost-discs - List user's lost discs (requires authentication)
router.get('/lost-discs', bagsListRateLimit, authenticateToken, listLostDiscsController);

// GET /api/bags/friends/:friendUserId - List friend's visible bags (requires authentication)
router.get('/friends/:friendUserId', bagsListRateLimit, authenticateToken, bagsFriendsListController);

// GET /api/bags/friends/:friendUserId/:bagId - Get specific friend's bag (requires authentication)
router.get('/friends/:friendUserId/:bagId', bagsListRateLimit, authenticateToken, getFriendBagController);

// GET /api/bags/:id - Get specific bag (requires authentication)
router.get('/:id', bagsListRateLimit, authenticateToken, getBagController);

// POST /api/bags - Create a new bag (requires authentication)
router.post('/', bagsCreateRateLimit, bagsRequestLimit, authenticateToken, bagsCreateController);

// PUT /api/bags/:id - Update specific bag (requires authentication)
router.put('/:id', bagsUpdateRateLimit, bagsRequestLimit, authenticateToken, updateBagController);

// DELETE /api/bags/:id - Delete specific bag (requires authentication)
router.delete('/:id', bagsDeleteRateLimit, authenticateToken, deleteBagController);

// POST /api/bags/:id/discs - Add disc to bag (requires authentication)
router.post('/:id/discs', bagsUpdateRateLimit, bagsRequestLimit, authenticateToken, bagContentsAddController);

// PUT /api/bags/:id/discs/:contentId - Edit disc in bag (requires authentication)
router.put('/:id/discs/:contentId', bagsUpdateRateLimit, bagsRequestLimit, authenticateToken, bagContentsEditController);

// PATCH /api/bags/discs/:contentId/lost - Mark disc as lost/found (requires authentication)
router.patch('/discs/:contentId/lost', bagsUpdateRateLimit, bagsRequestLimit, authenticateToken, bagContentsMarkLostController);

// DELETE /api/bags/discs/:contentId - Remove disc from account (requires authentication)
router.delete('/discs/:contentId', bagsDeleteRateLimit, authenticateToken, removeDiscController);

// PUT /api/bags/discs/move - Move discs between bags (requires authentication)
router.put('/discs/move', bagsBulkRateLimit, bagsRequestLimit, authenticateToken, moveDiscController);

export default router;
