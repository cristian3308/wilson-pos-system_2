"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ParkingController_1 = require("../controllers/ParkingController");
const CarwashController_1 = require("../controllers/CarwashController");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
const parkingController = new ParkingController_1.ParkingController();
const carwashController = new CarwashController_1.CarwashController();
router.get('/dashboard', async (req, res) => {
    try {
        logger_1.default.info('Dashboard data requested');
        const totalRevenue = 125840;
        const activeSpots = 15;
        const completedServices = 23;
        const activeEmployees = 8;
        const revenueData = [
            { date: 'Lun', revenue: 15000, parking: 8000, carwash: 7000 },
            { date: 'Mar', revenue: 18000, parking: 10000, carwash: 8000 },
            { date: 'Mié', revenue: 22000, parking: 12000, carwash: 10000 },
            { date: 'Jue', revenue: 19000, parking: 11000, carwash: 8000 },
            { date: 'Vie', revenue: 25000, parking: 15000, carwash: 10000 },
            { date: 'Sáb', revenue: 28000, parking: 16000, carwash: 12000 },
            { date: 'Dom', revenue: 20000, parking: 12000, carwash: 8000 }
        ];
        const occupancyData = [
            { name: 'Ocupados', value: activeSpots, color: '#EF4444' },
            { name: 'Disponibles', value: 50 - activeSpots, color: '#10B981' },
            { name: 'Fuera de servicio', value: 3, color: '#F59E0B' }
        ];
        const recentActivities = [
            {
                id: '1',
                type: 'parking',
                description: 'Vehículo ABC-123 registró entrada',
                time: 'Hace 5 min',
                status: 'completed',
                user: 'Juan Pérez'
            },
            {
                id: '2',
                type: 'carwash',
                description: 'Orden de lavado básico completada',
                time: 'Hace 10 min',
                amount: 15000,
                status: 'completed',
                user: 'María García'
            },
            {
                id: '3',
                type: 'payment',
                description: 'Pago procesado: $25,000',
                time: 'Hace 15 min',
                amount: 25000,
                status: 'completed'
            },
            {
                id: '4',
                type: 'service',
                description: 'Encerado de vehículo iniciado',
                time: 'Hace 20 min',
                status: 'pending',
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
        logger_1.default.info('Dashboard data sent successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map