import express from 'express';
import { register, login, logout, me } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);
router.post('/logout',                     logout);
router.get('/me',       authMiddleware,   me);

export default router;
