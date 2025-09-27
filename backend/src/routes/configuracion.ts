import { Router } from 'express';
import { ConfiguracionController } from '../controllers/ConfiguracionController';

const router = Router();
const configuracionController = new ConfiguracionController();

// Rutas de configuración
router.post('/sistema/inicializar', configuracionController.inicializarDatos.bind(configuracionController));
router.get('/sistema/tipos-vehiculos', configuracionController.obtenerTiposVehiculos.bind(configuracionController));
router.get('/sistema/configuracion', configuracionController.obtenerConfiguracion.bind(configuracionController));
router.put('/sistema/configuracion', configuracionController.actualizarConfiguracion.bind(configuracionController));
router.get('/sistema/estadisticas-completas', configuracionController.obtenerEstadisticasCompletas.bind(configuracionController));
router.get('/sistema/resumen-diario', configuracionController.obtenerResumenDiario.bind(configuracionController));

export default router;