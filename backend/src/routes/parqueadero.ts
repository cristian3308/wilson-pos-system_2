import { Router } from 'express';
import { ParkingController } from '../controllers/ParkingController';

const router = Router();
const parkingController = new ParkingController();

// Rutas de parqueadero
router.post('/parqueadero/entrada', parkingController.registerEntry.bind(parkingController));
router.post('/parqueadero/salida', parkingController.processExit.bind(parkingController));
router.get('/parqueadero/activos', parkingController.getActiveVehicles.bind(parkingController));
router.get('/parqueadero/vehiculos', parkingController.getActiveVehicles.bind(parkingController)); // Alias para frontend
router.get('/parqueadero/estadisticas', parkingController.getParkingStats.bind(parkingController));
router.get('/parqueadero/buscar', parkingController.getParkingHistory.bind(parkingController)); // Use history for search

export default router;