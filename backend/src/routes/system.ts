import { Router } from 'express';
import { SystemController } from '../controllers/SystemController';

const router = Router();
const systemController = new SystemController();

// Test connection endpoint
router.get('/test', systemController.testConnection.bind(systemController));

// System info endpoint
router.get('/system/info', systemController.getSystemInfo.bind(systemController));

export default router;