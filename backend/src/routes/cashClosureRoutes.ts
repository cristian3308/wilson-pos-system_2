import { Router } from 'express';
import { CashClosureController } from '../controllers/CashClosureController';

const router = Router();

// Crear un nuevo cierre de caja
router.post('/cash-closures', CashClosureController.createClosure);

// Obtener todos los cierres con filtros
router.get('/cash-closures', CashClosureController.getClosures);

// Obtener el último cierre
router.get('/cash-closures/last', CashClosureController.getLastClosure);

// Obtener estadísticas de cierres
router.get('/cash-closures/stats', CashClosureController.getClosureStats);

// Obtener un cierre específico por ID
router.get('/cash-closures/:id', CashClosureController.getClosureById);

// Eliminar todos los cierres de caja (admin)
router.delete('/cash-closures/clear-all', CashClosureController.clearAllClosures);

export default router;
