"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ConfiguracionController_1 = require("../controllers/ConfiguracionController");
const router = (0, express_1.Router)();
const configuracionController = new ConfiguracionController_1.ConfiguracionController();
router.post('/sistema/inicializar', configuracionController.inicializarDatos.bind(configuracionController));
router.get('/sistema/tipos-vehiculos', configuracionController.obtenerTiposVehiculos.bind(configuracionController));
router.get('/sistema/configuracion', configuracionController.obtenerConfiguracion.bind(configuracionController));
router.put('/sistema/configuracion', configuracionController.actualizarConfiguracion.bind(configuracionController));
router.get('/sistema/estadisticas-completas', configuracionController.obtenerEstadisticasCompletas.bind(configuracionController));
router.get('/sistema/resumen-diario', configuracionController.obtenerResumenDiario.bind(configuracionController));
exports.default = router;
//# sourceMappingURL=configuracion.js.map