import { Request, Response } from 'express';
import { dbService } from '../services/DatabaseService';
import logger from '../utils/logger';

interface CashClosureData {
  startDate: string;
  endDate: string;
  parkingRevenue: number;
  carwashRevenue: number;
  totalRevenue: number;
  totalCommissions: number;
  netProfit: number;
  parkingData: any[];
  carwashData: any[];
  parkingDetails?: any[];
  carwashDetails?: any[];
  workerCommissions: any[];
  notes?: string;
  createdBy?: string;
}

function parseClosure(closure: any) {
  return {
    ...closure,
    parkingData: JSON.parse(closure.parking_data || '[]'),
    carwashData: JSON.parse(closure.carwash_data || '[]'),
    parkingDetails: JSON.parse(closure.parking_details || '[]'),
    carwashDetails: JSON.parse(closure.carwash_details || '[]'),
    workerCommissions: JSON.parse(closure.worker_commissions || '[]')
  };
}

function validateClosureData(data: CashClosureData): string[] {
  const errors: string[] = [];
  if (!data.startDate) errors.push('startDate es requerido');
  if (!data.endDate) errors.push('endDate es requerido');
  if (data.parkingRevenue < 0) errors.push('parkingRevenue no puede ser negativo');
  if (data.carwashRevenue < 0) errors.push('carwashRevenue no puede ser negativo');
  if (data.totalRevenue < 0) errors.push('totalRevenue no puede ser negativo');
  if (data.totalCommissions < 0) errors.push('totalCommissions no puede ser negativo');
  if (data.netProfit === undefined || data.netProfit === null) errors.push('netProfit es requerido');
  return errors;
}

export class CashClosureController {
  static async createClosure(req: Request, res: Response) {
    try {
      const closureData: CashClosureData = req.body;

      const errors = validateClosureData(closureData);
      if (errors.length > 0) {
        res.status(400).json({ success: false, errors });
        return;
      }

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
          JSON.stringify(closureData.parkingDetails || []),
          JSON.stringify(closureData.carwashDetails || []),
          JSON.stringify(closureData.workerCommissions),
          closureData.createdBy || 'sistema',
          closureData.notes || '',
          1
        ]
      );

      const closures = await dbService.query(
        'SELECT * FROM cash_closures WHERE id = ?',
        [result.id]
      );

      res.status(201).json({
        success: true,
        message: 'Cierre de caja creado exitosamente',
        data: parseClosure(closures[0])
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

  static parseClosuresList(closures: any[]) {
    return closures.map(parseClosure);
  }

  // Obtener todos los cierres con filtros
  static async getClosures(req: Request, res: Response) {
    try {
      const { startDate, endDate, year, month, limit = '50' } = req.query;

      let queryString = 'SELECT * FROM cash_closures WHERE 1=1';
      const params: any[] = [];

      if (startDate) {
        queryString += ' AND DATE(start_date) >= DATE(?)';
        params.push(startDate);
      }

      if (endDate) {
        queryString += ' AND DATE(end_date) <= DATE(?)';
        params.push(endDate);
      }

      if (year) {
        queryString += ' AND strftime("%Y", start_date) = ?';
        params.push(year);
      }

      if (month) {
        queryString += ' AND strftime("%m", start_date) = ?';
        params.push(String(month).padStart(2, '0'));
      }

      queryString += ' ORDER BY end_date DESC LIMIT ?';
      params.push(parseInt(limit as string));

      const closures = await dbService.query(queryString, params);

      res.json({
        success: true,
        data: CashClosureController.parseClosuresList(closures),
        total: closures.length
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
        data: parseClosure(closure)
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
        data: parseClosure(closure)
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

  // Limpiar datos operativos post-cierre
  static async clearOperationalData(req: Request, res: Response) {
    try {
      const parkingResult = await dbService.run(
        `DELETE FROM vehiculos_parqueadero WHERE estado IN ('FINALIZADO', 'CANCELADO')`, []
      );
      const carwashResult = await dbService.run(
        `DELETE FROM ordenes_lavadero WHERE estado IN ('TERMINADO', 'CANCELADO')`, []
      );
      await dbService.run(
        `DELETE FROM orden_servicios WHERE orden_id NOT IN (SELECT id FROM ordenes_lavadero)`, []
      );

      logger.info(`Post-closure cleanup: ${parkingResult.changes} parking, ${carwashResult.changes} carwash records deleted`);

      res.json({
        success: true,
        message: `Datos operativos limpiados: ${parkingResult.changes} registros de parqueadero, ${carwashResult.changes} órdenes de lavadero eliminadas`,
        deletedParking: parkingResult.changes,
        deletedCarwash: carwashResult.changes
      });
    } catch (error: any) {
      logger.error('Error clearing operational data:', error);
      res.status(500).json({
        success: false,
        message: 'Error al limpiar datos operativos',
        error: error.message
      });
    }
  }

  // Eliminar todos los cierres de caja (función administrativa)
  static async clearAllClosures(req: Request, res: Response) {
    try {
      console.log('🗑️ Eliminando todos los cierres de caja...');
      
      const countResult = await dbService.query('SELECT COUNT(*) as count FROM cash_closures', []);
      const count = countResult[0]?.count || 0;
      
      await dbService.run('DELETE FROM cash_closures', []);
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
