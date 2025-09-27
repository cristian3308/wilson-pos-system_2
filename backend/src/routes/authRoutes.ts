import express from 'express';
import AuthController from '../controllers/AuthController';
import { authValidator } from '../validators/authValidator';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', authValidator.register, AuthController.register);
router.post('/login', authValidator.login, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, authValidator.updateProfile, AuthController.updateProfile);
router.post('/change-password', authMiddleware, authValidator.changePassword, AuthController.changePassword);

export default router;