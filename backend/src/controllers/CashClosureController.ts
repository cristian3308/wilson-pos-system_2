import { Request, Response } from 'express';
import { dbService } from '../services/DatabaseService';

interface CashClosureData {
  startDate: string;
  endDate: string;
  parkingRevenue: number;
  carwashRevenue: number;
  totalRevenue: number;
  totalCommissions: number;
  netProfit: number;
  parkingData: any[]; // Resumen por tipo de vehículo
  carwashData: any[]; // Resumen por servicio
  parkingDetails?: any[]; // ✅ NUEVO: Detalle completo de cada vehículo
  carwashDetails?: any[]; // ✅ NUEVO: Detalle completo de cada lavado
  workerCommissions: any[];
  notes?: string;
  createdBy?: string;
}

export class CashClosureController {
  // Crear un nuevo cierre de caja
  static async createClosure(req: Request, res: Response) {
    try {
      const closureData: CashClosureData = req.body;

      // Generar número de cierre único
      const closureNumber = `CLS-${Date.now()}`;

      const result = await dbService.run(
        `INSERT INTO cash_closures (
          closure_number, start_date, end_date, 
          parking_revenue, carwash_revenue, total_revenue,
          total_commissions, net_profit,
          parking_data, carwash_data, parking_details, carwash_details, worker_commissions,
          created_by, notes, pdf_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          closureNumber,
          closureData.startDate,
          closureData.endDate,
          closureData.parkingRevenue,
          closureData.carwashRevenue,
          closureData.totalRevenue,
          closureData.totalCommissions,
          closureData.netProfit,
          JSON.stringify(closureData.parkingData),
          JSON.stringify(closureData.carwashData),
          JSON.stringify(closureData.parkingDetails || []), // ✅ NUEVO
          JSON.stringify(closureData.carwashDetails || []), // ✅ NUEVO
          JSON.stringify(closureData.workerCommissions),
          closureData.createdBy || 'sistema',
          closureData.notes || '',
          1 // PDF generado
        ]
      );

      const closures = await dbService.query(
        'SELECT * FROM cash_closures WHERE id = ?',
        [result.id]
      );
      const closure = closures[0];

      res.status(201).json({
        success: true,
        message: 'Cierre de caja creado exitosamente',
        data: {
          ...closure,
          parkingData: JSON.parse(closure.parking_data),
          carwashData: JSON.parse(closure.carwash_data),
          workerCommissions: JSON.parse(closure.worker_commissions)
        }
      });
    } catch (error: any) {
      console.error('Error creating cash closure:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el cierre de caja',
        error: error.message
      });
    }
  }

  // Obtener todos los cierres con filtros
  static async getClosures(req: Request, res: Response) {
    try {
      const { startDate, endDate, year, month, limit = '50' } = req.query;

      let queryString = 'SELECT * FROM cash_closures WHERE 1=1';
      const params: any[] = [];

      // Filtro por fecha de inicio
      if (startDate) {
        queryString += ' AND DATE(start_date) >= DATE(?)';
        params.push(startDate);
      }

      // Filtro por fecha de fin
      if (endDate) {
        queryString += ' AND DATE(end_date) <= DATE(?)';
        params.push(endDate);
      }

      // Filtro por año
      if (year) {
        queryString += ' AND strftime("%Y", start_date) = ?';
        params.push(year);
      }

      // Filtro por mes
      if (month) {
        queryString += ' AND strftime("%m", start_date) = ?';
        params.push(String(month).padStart(2, '0'));
      }

      queryString += ' ORDER BY end_date DESC LIMIT ?';
      params.push(parseInt(limit as string));

      const closures = await dbService.query(queryString, params);

      // Parsear JSON fields
      const parsedClosures = closures.map((closure: any) => ({
        ...closure,
        parkingData: JSON.parse(closure.parking_data || '[]'),
        carwashData: JSON.parse(closure.carwash_data || '[]'),
        workerCommissions: JSON.parse(closure.worker_commissions || '[]')
      }));

      res.json({
        success: true,
        data: parsedClosures,
        total: parsedClosures.length
      });
    } catch (error: any) {
      console.error('Error fetching cash closures:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los cierres de caja',
        error: error.message
      });
    }
  }

  // Obtener un cierre específico por ID
  static async getClosureById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const closures = await dbService.query(
        'SELECT * FROM cash_closures WHERE id = ?',
        [id]
      );
      const closure = closures[0];

      if (!closure) {
        return res.status(404).json({
          success: false,
          message: 'Cierre de caja no encontrado'
        });
      }

      return res.json({
        success: true,
        data: {
          ...closure,
          parkingData: JSON.parse(closure.parking_data || '[]'),
          carwashData: JSON.parse(closure.carwash_data || '[]'),
          workerCommissions: JSON.parse(closure.worker_commissions || '[]')
        }
      });
    } catch (error: any) {
      console.error('Error fetching cash closure:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el cierre de caja',
        error: error.message
      });
    }
  }

  // Obtener el último cierre de caja
  static async getLastClosure(req: Request, res: Response) {
    try {
      const closures = await dbService.query(
        'SELECT * FROM cash_closures ORDER BY end_date DESC LIMIT 1'
      );
      const closure = closures[0];

      if (!closure) {
        return res.json({
          success: true,
          data: null,
          message: 'No hay cierres de caja registrados'
        });
      }

      return res.json({
        success: true,
        data: {
          ...closure,
          parkingData: JSON.parse(closure.parking_data || '[]'),
          carwashData: JSON.parse(closure.carwash_data || '[]'),
          workerCommissions: JSON.parse(closure.worker_commissions || '[]')
        }
      });
    } catch (error: any) {
      console.error('Error fetching last closure:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el último cierre',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de cierres
  static async getClosureStats(req: Request, res: Response) {
    try {
      const { year, month } = req.query;

      let queryString = `
        SELECT 
          COUNT(*) as total_closures,
          SUM(total_revenue) as total_revenue,
          SUM(net_profit) as total_profit,
          AVG(total_revenue) as avg_revenue,
          MAX(total_revenue) as max_revenue,
          MIN(total_revenue) as min_revenue
        FROM cash_closures 
        WHERE 1=1
      `;
      const params: any[] = [];

      if (year) {
        queryString += ' AND strftime("%Y", start_date) = ?';
        params.push(year);
      }

      if (month) {
        queryString += ' AND strftime("%m", start_date) = ?';
        params.push(String(month).padStart(2, '0'));
      }

      const statsResult = await dbService.query(queryString, params);
      const stats = statsResult[0];

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error fetching closure stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        error: error.message
      });
    }
  }

  // Eliminar todos los cierres de caja (función administrativa)
  static async clearAllClosures(req: Request, res: Response) {
    try {
      console.log('🗑️ Eliminando todos los cierres de caja...');
      
      // Contar cuántos cierres hay antes de eliminar
      const countResult = await dbService.query('SELECT COUNT(*) as count FROM cash_closures', []);
      const count = countResult[0]?.count || 0;
      
      // Eliminar todos los cierres de caja
      await dbService.run('DELETE FROM cash_closures', []);
      
      // Resetear el auto-increment
      await dbService.run('DELETE FROM sqlite_sequence WHERE name = "cash_closures"', []);
      
      console.log(`✅ ${count} cierres de caja eliminados correctamente`);
      
      res.json({
        success: true,
        message: `Se eliminaron ${count} cierres de caja correctamente`,
        deletedCount: count
      });
    } catch (error: any) {
      console.error('❌ Error eliminando cierres de caja:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar los cierres de caja',
        error: error.message
      });
    }
  }
}
