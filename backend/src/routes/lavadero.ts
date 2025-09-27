import { Router } from 'express';
import { CarwashController } from '../controllers/CarwashController';

const router = Router();
const carwashController = new CarwashController();

// Rutas de lavadero
router.post('/lavadero/orden', carwashController.createOrder.bind(carwashController));
router.put('/lavadero/orden/:id/estado', carwashController.updateOrderStatus.bind(carwashController));
router.get('/lavadero/ordenes-activas', carwashController.getOrders.bind(carwashController));
router.get('/lavadero/ordenes', carwashController.getOrders.bind(carwashController)); // Alias para frontend
router.get('/lavadero/estadisticas', carwashController.getCarwashStats.bind(carwashController));
router.get('/lavadero/buscar', carwashController.getOrders.bind(carwashController));
router.get('/lavadero/servicios', carwashController.getServices.bind(carwashController));

export default router;