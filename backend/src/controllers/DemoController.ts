import { Request, Response } from 'express';
import { sampleProducts, sampleSales, sampleCustomers } from '../data/sampleData';
import { dbService } from '../services/DatabaseService';
import logger from '../utils/logger';

export class DemoController {
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Demo products requested', { ip: req.ip });
      res.json({
        status: 'success',
        data: sampleProducts,
        total: sampleProducts.length,
        message: 'Demo products retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting demo products:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to get demo products'
      });
    }
  }

  async getSales(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Demo sales requested', { ip: req.ip });
      
      // Calculate today's sales summary
      const todaySales = sampleSales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
      });

      const totalToday = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      const totalAllTime = sampleSales.reduce((sum, sale) => sum + sale.total, 0);

      res.json({
        status: 'success',
        data: {
          sales: sampleSales,
          summary: {
            todayTotal: totalToday,
            todayCount: todaySales.length,
            allTimeTotal: totalAllTime,
            allTimeCount: sampleSales.length
          }
        },
        message: 'Demo sales retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting demo sales:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to get demo sales'
      });
    }
  }

  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Demo customers requested', { ip: req.ip });
      res.json({
        status: 'success',
        data: sampleCustomers,
        total: sampleCustomers.length,
        message: 'Demo customers retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting demo customers:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to get demo customers'
      });
    }
  }

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Dashboard stats requested', { ip: req.ip });
      
      const today = new Date().toISOString().split('T')[0];

      try {
        // Get real parking statistics
        const parkingStats = await dbService.query(`
          SELECT 
            COUNT(CASE WHEN DATE(fecha_entrada) = ? THEN 1 END) as entradas_hoy,
            COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as vehiculos_activos,
            COALESCE(SUM(CASE WHEN DATE(fecha_entrada) = ? AND estado = 'FINALIZADO' THEN total_pagar ELSE 0 END), 0) as ingresos_parking_hoy
          FROM vehiculos_parqueadero
        `, [today, today]);

        // Get real carwash statistics  
        const carwashStats = await dbService.query(`
          SELECT 
            COUNT(CASE WHEN DATE(fecha_creacion) = ? THEN 1 END) as ordenes_hoy,
            COUNT(CASE WHEN estado = 'EN_PROCESO' THEN 1 END) as servicios_activos,
            COALESCE(SUM(CASE WHEN DATE(fecha_creacion) = ? AND estado = 'TERMINADO' THEN total ELSE 0 END), 0) as ingresos_lavadero_hoy
          FROM ordenes_lavadero
        `, [today, today]);

        // Get vehicle types breakdown
        const vehicleTypes = await dbService.query(`
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

      } catch (dbError) {
        logger.warn('Database not ready, falling back to demo data', dbError);
        
        // Fallback to demo data if database is not ready
        const totalProducts = sampleProducts.length;
        const totalStock = sampleProducts.reduce((sum, product) => sum + product.stock, 0);
        const lowStockProducts = sampleProducts.filter(product => product.stock < 20).length;
        
        const totalSales = sampleSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalCustomers = sampleCustomers.length;
        
        // Today's sales
        const todaySales = sampleSales.filter(sale => {
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
                totalCount: sampleSales.length
              },
              customers: {
                total: totalCustomers,
                activeToday: Math.floor(totalCustomers * 0.3)
              },
              topProducts: sampleProducts
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

    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to get dashboard stats'
      });
    }
  }
}