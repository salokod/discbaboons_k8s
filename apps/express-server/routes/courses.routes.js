import express from 'express';
import coursesSearchController from '../controllers/courses.search.controller.js';
import coursesGetController from '../controllers/courses.get.controller.js';
import coursesSubmitController from '../controllers/courses.submit.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/courses - Search courses with optional filters (requires authentication)
router.get('/', authenticateToken, coursesSearchController);

// GET /api/courses/:id - Get course details (requires authentication)
router.get('/:id', authenticateToken, coursesGetController);

// POST /api/courses - Submit new course (requires authentication)
router.post('/', authenticateToken, coursesSubmitController);

export default router;
