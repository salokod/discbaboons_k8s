import express from 'express';
import registerController from '../controllers/auth.register.controller.js';
import loginController from '../controllers/auth.login.controller.js';
import forgotUsernameController from '../controllers/auth.forgotusername.controller.js';
import forgotPasswordController from '../controllers/auth.forgotpassword.controller.js';

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/forgot-username', forgotUsernameController);
router.post('/forgot-password', forgotPasswordController);

export default router;
