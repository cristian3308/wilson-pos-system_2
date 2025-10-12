"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashClosureController = void 0;
const DatabaseService_1 = require("../services/DatabaseService");
class CashClosureController {
    static async createClosure(req, res) {
        try {
            const closureData = req.body;
            const closureNumber = `CLS-${Date.now()}`;
            const result = await DatabaseService_1.dbService.run(`INSERT INTO cash_closures (
          closure_number, start_date, end_date, 
          parking_revenue, carwash_revenue, total_revenue,
          total_commissions, net_profit,
          parking_data, carwash_data, parking_details, carwash_details, worker_commissions,
          created_by, notes, pdf_generated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
            ]);
            const closures = await DatabaseService_1.dbService.query('SELECT * FROM cash_closures WHERE id = ?', [result.id]);
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
        }
        catch (error) {
            console.error('Error creating cash closure:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el cierre de caja',
                error: error.message
            });
        }
    }
    static async getClosures(req, res) {
        try {
            const { startDate, endDate, year, month, limit = '50' } = req.query;
            let queryString = 'SELECT * FROM cash_closures WHERE 1=1';
            const params = [];
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
            params.push(parseInt(limit));
            const closures = await DatabaseService_1.dbService.query(queryString, params);
            const parsedClosures = closures.map((closure) => ({
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
        }
        catch (error) {
            console.error('Error fetching cash closures:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los cierres de caja',
                error: error.message
            });
        }
    }
    static async getClosureById(req, res) {
        try {
            const { id } = req.params;
            const closures = await DatabaseService_1.dbService.query('SELECT * FROM cash_closures WHERE id = ?', [id]);
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
        }
        catch (error) {
            console.error('Error fetching cash closure:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener el cierre de caja',
                error: error.message
            });
        }
    }
    static async getLastClosure(req, res) {
        try {
            const closures = await DatabaseService_1.dbService.query('SELECT * FROM cash_closures ORDER BY end_date DESC LIMIT 1');
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
        }
        catch (error) {
            console.error('Error fetching last closure:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener el último cierre',
                error: error.message
            });
        }
    }
    static async getClosureStats(req, res) {
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
            const params = [];
            if (year) {
                queryString += ' AND strftime("%Y", start_date) = ?';
                params.push(year);
            }
            if (month) {
                queryString += ' AND strftime("%m", start_date) = ?';
                params.push(String(month).padStart(2, '0'));
            }
            const statsResult = await DatabaseService_1.dbService.query(queryString, params);
            const stats = statsResult[0];
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error fetching closure stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las estadísticas',
                error: error.message
            });
        }
    }
    static async clearAllClosures(req, res) {
        try {
            console.log('🗑️ Eliminando todos los cierres de caja...');
            const countResult = await DatabaseService_1.dbService.query('SELECT COUNT(*) as count FROM cash_closures', []);
            const count = countResult[0]?.count || 0;
            await DatabaseService_1.dbService.run('DELETE FROM cash_closures', []);
            await DatabaseService_1.dbService.run('DELETE FROM sqlite_sequence WHERE name = "cash_closures"', []);
            console.log(`✅ ${count} cierres de caja eliminados correctamente`);
            res.json({
                success: true,
                message: `Se eliminaron ${count} cierres de caja correctamente`,
                deletedCount: count
            });
        }
        catch (error) {
            console.error('❌ Error eliminando cierres de caja:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar los cierres de caja',
                error: error.message
            });
        }
    }
}
exports.CashClosureController = CashClosureController;
//# sourceMappingURL=CashClosureController.js.map