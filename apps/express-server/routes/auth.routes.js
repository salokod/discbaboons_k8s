import express from 'express';
import registerController from '../controllers/auth.register.controller.js';
import loginController from '../controllers/auth.login.controller.js';
import forgotUsernameController from '../controllers/auth.forgotusername.controller.js';
import forgotPasswordController from '../controllers/auth.forgotpassword.controller.js';
import changePasswordController from '../controllers/auth.changepassword.controller.js';
import refreshController from '../controllers/auth.refresh.controller.js';

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/forgot-username', forgotUsernameController);
router.post('/forgot-password', forgotPasswordController);
router.post('/change-password', changePasswordController);
router.post('/refresh', refreshController);

export default router;
