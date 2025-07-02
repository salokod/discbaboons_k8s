import express from 'express';
import bagsCreateController from '../controllers/bags.create.controller.js';
import bagsListController from '../controllers/bags.list.controller.js';
import getBagController from '../controllers/bags.get.controller.js';
import updateBagController from '../controllers/bags.update.controller.js';
import deleteBagController from '../controllers/bags.delete.controller.js';
import bagContentsAddController from '../controllers/bag-contents.add.controller.js';
import bagContentsEditController from '../controllers/bag-contents.edit.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/bags - List user's bags (requires authentication)
router.get('/', authenticateToken, bagsListController);

// GET /api/bags/:id - Get specific bag (requires authentication)
router.get('/:id', authenticateToken, getBagController);

// POST /api/bags - Create a new bag (requires authentication)
router.post('/', authenticateToken, bagsCreateController);

// PUT /api/bags/:id - Update specific bag (requires authentication)
router.put('/:id', authenticateToken, updateBagController);

// DELETE /api/bags/:id - Delete specific bag (requires authentication)
router.delete('/:id', authenticateToken, deleteBagController);

// POST /api/bags/:id/discs - Add disc to bag (requires authentication)
router.post('/:id/discs', authenticateToken, bagContentsAddController);

// PUT /api/bags/:id/discs/:contentId - Edit disc in bag (requires authentication)
router.put('/:id/discs/:contentId', authenticateToken, bagContentsEditController);

export default router;
