import express from 'express';
import { ParkingController } from '../controllers/ParkingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const parkingController = new ParkingController();

// Vehicle entry
router.post('/entry', async (req, res) => {
  await parkingController.registerEntry(req, res);
});

// Vehicle exit
router.post('/exit', async (req, res) => {
  await parkingController.processExit(req, res);
});

// Get active vehicles
router.get('/active', async (req, res) => {
  await parkingController.getActiveVehicles(req, res);
});

// Get parking history
router.get('/history', async (req, res) => {
  await parkingController.getParkingHistory(req, res);
});

// Get parking statistics
router.get('/stats', async (req, res) => {
  await parkingController.getParkingStats(req, res);
});

// Legacy routes (keeping for compatibility)
router.get('/spots', authMiddleware, (req, res) => {
  res.json({ message: 'Use /active endpoint instead' });
});

router.post('/spots', authMiddleware, (req, res) => {
  res.json({ message: 'Use /entry endpoint instead' });
});

router.get('/tickets', authMiddleware, (req, res) => {
  res.json({ message: 'Use /history endpoint instead' });
});

router.post('/tickets', authMiddleware, (req, res) => {
  res.json({ message: 'Use /entry endpoint instead' });
});

router.put('/tickets/:id/exit', authMiddleware, (req, res) => {
  res.json({ message: 'Use /exit endpoint instead' });
});

export default router;