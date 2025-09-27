import { Router } from 'express';
import { ParkingController } from '../controllers/ParkingController';
import { CarwashController } from '../controllers/CarwashController';
import logger from '../utils/logger';

const router = Router();
const parkingController = new ParkingController();
const carwashController = new CarwashController();

// GET /api/v1/dashboard - Obtener datos del dashboard
router.get('/dashboard', async (req, res) => {
  try {
    logger.info('Dashboard data requested');

    // Por ahora, devolver datos simulados hasta que integremos completamente
    const totalRevenue = 125840;
    const activeSpots = 15;
    const completedServices = 23;
    const activeEmployees = 8;

    // Datos de ingresos simulados por día
    const revenueData = [
      { date: 'Lun', revenue: 15000, parking: 8000, carwash: 7000 },
      { date: 'Mar', revenue: 18000, parking: 10000, carwash: 8000 },
      { date: 'Mié', revenue: 22000, parking: 12000, carwash: 10000 },
      { date: 'Jue', revenue: 19000, parking: 11000, carwash: 8000 },
      { date: 'Vie', revenue: 25000, parking: 15000, carwash: 10000 },
      { date: 'Sáb', revenue: 28000, parking: 16000, carwash: 12000 },
      { date: 'Dom', revenue: 20000, parking: 12000, carwash: 8000 }
    ];

    // Datos de ocupación
    const occupancyData = [
      { name: 'Ocupados', value: activeSpots, color: '#EF4444' },
      { name: 'Disponibles', value: 50 - activeSpots, color: '#10B981' },
      { name: 'Fuera de servicio', value: 3, color: '#F59E0B' }
    ];

    // Actividades recientes simuladas
    const recentActivities = [
      {
        id: '1',
        type: 'parking' as const,
        description: 'Vehículo ABC-123 registró entrada',
        time: 'Hace 5 min',
        status: 'completed' as const,
        user: 'Juan Pérez'
      },
      {
        id: '2',
        type: 'carwash' as const,
        description: 'Orden de lavado básico completada',
        time: 'Hace 10 min',
        amount: 15000,
        status: 'completed' as const,
        user: 'María García'
      },
      {
        id: '3',
        type: 'payment' as const,
        description: 'Pago procesado: $25,000',
        time: 'Hace 15 min',
        amount: 25000,
        status: 'completed' as const
      },
      {
        id: '4',
        type: 'service' as const,
        description: 'Encerado de vehículo iniciado',
        time: 'Hace 20 min',
        status: 'pending' as const,
        user: 'Carlos López'
      }
    ];

    const dashboardData = {
      metrics: {
        totalRevenue,
        activeSpots,
        completedServices,
        activeEmployees
      },
      revenueData,
      occupancyData,
      recentActivities
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

    logger.info('Dashboard data sent successfully');
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

export default router;