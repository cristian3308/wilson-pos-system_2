import { Router } from 'express';
import { DemoController } from '../controllers/DemoController';

const router = Router();
const demoController = new DemoController();

// Demo data endpoints
router.get('/demo/products', demoController.getProducts.bind(demoController));
router.get('/demo/sales', demoController.getSales.bind(demoController));
router.get('/demo/customers', demoController.getCustomers.bind(demoController));
router.get('/demo/dashboard-stats', demoController.getDashboardStats.bind(demoController));

// Dashboard endpoint (alias for the main dashboard)
router.get('/dashboard', demoController.getDashboardStats.bind(demoController));

export default router;