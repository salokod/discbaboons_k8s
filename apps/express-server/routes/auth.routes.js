import express from 'express';
import registerController from '../controllers/auth.register.controller.js';

const router = express.Router();

router.post('/register', registerController);

export default router;
