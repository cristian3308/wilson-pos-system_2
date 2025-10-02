"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ParkingController_1 = require("../controllers/ParkingController");
const router = (0, express_1.Router)();
const parkingController = new ParkingController_1.ParkingController();
router.post('/parqueadero/entrada', parkingController.registerEntry.bind(parkingController));
router.post('/parqueadero/salida', parkingController.processExit.bind(parkingController));
router.get('/parqueadero/activos', parkingController.getActiveVehicles.bind(parkingController));
router.get('/parqueadero/vehiculos', parkingController.getActiveVehicles.bind(parkingController));
router.get('/parqueadero/estadisticas', parkingController.getParkingStats.bind(parkingController));
router.get('/parqueadero/buscar', parkingController.getParkingHistory.bind(parkingController));
exports.default = router;
//# sourceMappingURL=parqueadero.js.map