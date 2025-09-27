import express from 'express';
import { CarwashController } from '../controllers/CarwashController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const carwashController = new CarwashController();

// Get available services
router.get('/services', async (req, res) => {
  await carwashController.getServices(req, res);
});

// Create new order
router.post('/orders', async (req, res) => {
  await carwashController.createOrder(req, res);
});

// Get orders
router.get('/orders', async (req, res) => {
  await carwashController.getOrders(req, res);
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  await carwashController.updateOrderStatus(req, res);
});

// Get carwash statistics
router.get('/stats', async (req, res) => {
  await carwashController.getCarwashStats(req, res);
});

// Legacy routes (keeping for compatibility)
router.post('/services', authMiddleware, (req, res) => {
  res.json({ message: 'Services are pre-configured. Use GET /services to retrieve them.' });
});

export default router;