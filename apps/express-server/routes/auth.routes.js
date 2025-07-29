import express from 'express';
import registerController from '../controllers/auth.register.controller.js';
import loginController from '../controllers/auth.login.controller.js';
import forgotUsernameController from '../controllers/auth.forgotusername.controller.js';
import forgotPasswordController from '../controllers/auth.forgotpassword.controller.js';
import changePasswordController from '../controllers/auth.changepassword.controller.js';
import refreshController from '../controllers/auth.refresh.controller.js';
import {
  authRateLimit, passwordRateLimit, usernameRecoveryRateLimit, loginBruteForceProtection,
} from '../middleware/authRateLimit.middleware.js';
import { authRequestLimit, restrictiveRequestLimit } from '../middleware/requestLimit.middleware.js';
import securityHeaders from '../middleware/securityHeaders.middleware.js';

const router = express.Router();

// Apply security headers to all auth routes
router.use(securityHeaders);

// Apply security middleware based on endpoint sensitivity
router.post('/register', authRateLimit, authRequestLimit, registerController);
router.post('/login', authRateLimit, loginBruteForceProtection, authRequestLimit, loginController);
router.post('/forgot-username', usernameRecoveryRateLimit, restrictiveRequestLimit, forgotUsernameController);
router.post('/forgot-password', passwordRateLimit, restrictiveRequestLimit, forgotPasswordController);
router.post('/change-password', passwordRateLimit, restrictiveRequestLimit, changePasswordController);
router.post('/refresh', authRateLimit, authRequestLimit, refreshController);

export default router;
