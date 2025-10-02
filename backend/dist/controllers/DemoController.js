"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoController = void 0;
const sampleData_1 = require("../data/sampleData");
const DatabaseService_1 = require("../services/DatabaseService");
const logger_1 = __importDefault(require("../utils/logger"));
class DemoController {
    async getProducts(req, res) {
        try {
            logger_1.default.info('Demo products requested', { ip: req.ip });
            res.json({
                status: 'success',
                data: sampleData_1.sampleProducts,
                total: sampleData_1.sampleProducts.length,
                message: 'Demo products retrieved successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error getting demo products:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to get demo products'
            });
        }
    }
    async getSales(req, res) {
        try {
            logger_1.default.info('Demo sales requested', { ip: req.ip });
            const todaySales = sampleData_1.sampleSales.filter(sale => {
                const saleDate = new Date(sale.timestamp);
                const today = new Date();
                return saleDate.toDateString() === today.toDateString();
            });
            const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
            const totalAllTime = sampleData_1.sampleSales.reduce((sum, sale) => sum + sale.total, 0);
            res.json({
                status: 'success',
                data: {
                    sales: sampleData_1.sampleSales,
                    summary: {
                        todayTotal: totalToday,
                        todayCount: todaySales.length,
                        allTimeTotal: totalAllTime,
                        allTimeCount: sampleData_1.sampleSales.length
                    }
                },
                message: 'Demo sales retrieved successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error getting demo sales:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to get demo sales'
            });
        }
    }
    async getCustomers(req, res) {
        try {
            logger_1.default.info('Demo customers requested', { ip: req.ip });
            res.json({
                status: 'success',
                data: sampleData_1.sampleCustomers,
                total: sampleData_1.sampleCustomers.length,
                message: 'Demo customers retrieved successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error getting demo customers:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to get demo customers'
            });
        }
    }
    async getDashboardStats(req, res) {
        try {
            logger_1.default.info('Dashboard stats requested', { ip: req.ip });
            const today = new Date().toISOString().split('T')[0];
            try {
                const parkingStats = await DatabaseService_1.dbService.query(`
          SELECT 
            COUNT(CASE WHEN DATE(fecha_entrada) = ? THEN 1 END) as entradas_hoy,
            COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as vehiculos_activos,
            COALESCE(SUM(CASE WHEN DATE(fecha_entrada) = ? AND estado = 'FINALIZADO' THEN total_pagar ELSE 0 END), 0) as ingresos_parking_hoy
          FROM vehiculos_parqueadero
        `, [today, today]);
                const carwashStats = await DatabaseService_1.dbService.query(`
          SELECT 
            COUNT(CASE WHEN DATE(fecha_creacion) = ? THEN 1 END) as ordenes_hoy,
            COUNT(CASE WHEN estado = 'EN_PROCESO' THEN 1 END) as servicios_activos,
            COALESCE(SUM(CASE WHEN DATE(fecha_creacion) = ? AND estado = 'TERMINADO' THEN total ELSE 0 END), 0) as ingresos_lavadero_hoy
          FROM ordenes_lavadero
        `, [today, today]);
                const vehicleTypes = await DatabaseService_1.dbService.query(`
          SELECT tv.nombre, COUNT(v.id) as cantidad
          FROM tipos_vehiculos tv
          LEFT JOIN vehiculos_parqueadero v ON tv.id = v.tipo_vehiculo_id AND v.estado = 'ACTIVO'
          WHERE tv.activo = 1
          GROUP BY tv.id, tv.nombre
        `);
                const parkingData = parkingStats[0] || { entradas_hoy: 0, vehiculos_activos: 0, ingresos_parking_hoy: 0 };
                const carwashData = carwashStats[0] || { ordenes_hoy: 0, servicios_activos: 0, ingresos_lavadero_hoy: 0 };
                res.json({
                    status: 'success',
                    data: {
                        parking: {
                            todayEntries: parkingData.entradas_hoy,
                            activeVehicles: parkingData.vehiculos_activos,
                            todayRevenue: parkingData.ingresos_parking_hoy
                        },
                        carwash: {
                            todayOrders: carwashData.ordenes_hoy,
                            activeServices: carwashData.servicios_activos,
                            todayRevenue: carwashData.ingresos_lavadero_hoy
                        },
                        general: {
                            totalRevenue: parkingData.ingresos_parking_hoy + carwashData.ingresos_lavadero_hoy,
                            vehicleTypes: vehicleTypes
                        }
                    },
                    message: 'Real dashboard stats retrieved successfully'
                });
            }
            catch (dbError) {
                logger_1.default.warn('Database not ready, falling back to demo data', dbError);
                const totalProducts = sampleData_1.sampleProducts.length;
                const totalStock = sampleData_1.sampleProducts.reduce((sum, product) => sum + product.stock, 0);
                const lowStockProducts = sampleData_1.sampleProducts.filter(product => product.stock < 20).length;
                const totalSales = sampleData_1.sampleSales.reduce((sum, sale) => sum + sale.total, 0);
                const totalCustomers = sampleData_1.sampleCustomers.length;
                const todaySales = sampleData_1.sampleSales.filter(sale => {
                    const saleDate = new Date(sale.timestamp);
                    const today = new Date();
                    return saleDate.toDateString() === today.toDateString();
                });
                const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
                res.json({
                    status: 'success',
                    data: {
                        parking: {
                            todayEntries: 15,
                            activeVehicles: 8,
                            todayRevenue: 45000
                        },
                        carwash: {
                            todayOrders: 6,
                            activeServices: 2,
                            todayRevenue: 65000
                        },
                        general: {
                            totalRevenue: 110000,
                            vehicleTypes: [
                                { nombre: 'Carro', cantidad: 5 },
                                { nombre: 'Moto', cantidad: 3 },
                                { nombre: 'Bicicleta', cantidad: 0 }
                            ]
                        },
                        demo: {
                            products: {
                                total: totalProducts,
                                totalStock: totalStock,
                                lowStock: lowStockProducts
                            },
                            sales: {
                                todayRevenue: todayRevenue,
                                todayCount: todaySales.length,
                                totalRevenue: totalSales,
                                totalCount: sampleData_1.sampleSales.length
                            },
                            customers: {
                                total: totalCustomers,
                                activeToday: Math.floor(totalCustomers * 0.3)
                            },
                            topProducts: sampleData_1.sampleProducts
                                .sort((a, b) => b.price - a.price)
                                .slice(0, 3)
                                .map(product => ({
                                name: product.name,
                                sales: Math.floor(Math.random() * 50) + 10,
                                revenue: product.price * (Math.floor(Math.random() * 50) + 10)
                            }))
                        }
                    },
                    message: 'Dashboard stats retrieved successfully (demo mode)'
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error getting dashboard stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to get dashboard stats'
            });
        }
    }
}
exports.DemoController = DemoController;
//# sourceMappingURL=DemoController.js.map