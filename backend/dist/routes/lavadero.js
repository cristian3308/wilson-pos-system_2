"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CarwashController_1 = require("../controllers/CarwashController");
const router = (0, express_1.Router)();
const carwashController = new CarwashController_1.CarwashController();
router.post('/lavadero/orden', carwashController.createOrder.bind(carwashController));
router.put('/lavadero/orden/:id/estado', carwashController.updateOrderStatus.bind(carwashController));
router.get('/lavadero/ordenes-activas', carwashController.getOrders.bind(carwashController));
router.get('/lavadero/ordenes', carwashController.getOrders.bind(carwashController));
router.get('/lavadero/estadisticas', carwashController.getCarwashStats.bind(carwashController));
router.get('/lavadero/buscar', carwashController.getOrders.bind(carwashController));
router.get('/lavadero/servicios', carwashController.getServices.bind(carwashController));
exports.default = router;
//# sourceMappingURL=lavadero.js.map