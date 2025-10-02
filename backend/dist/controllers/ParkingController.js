"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParkingController = void 0;
const DatabaseService_1 = require("../services/DatabaseService");
const logger_1 = __importDefault(require("../utils/logger"));
class ParkingController {
    generateBarcode() {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `POS${timestamp}${random}`;
    }
    calculateFee(entryTime, exitTime, hourlyRate, dailyRate) {
        const durationMs = exitTime.getTime() - entryTime.getTime();
        const hours = Math.ceil(durationMs / (1000 * 60 * 60));
        if (hours > 8) {
            const days = Math.ceil(hours / 24);
            return days * dailyRate;
        }
        else {
            return hours * hourlyRate;
        }
    }
    async registerEntry(req, res) {
        try {
            const { placa, tipoVehiculo, propietario = '', telefono = '', observaciones = '' } = req.body;
            if (!placa || !tipoVehiculo) {
                res.status(400).json({
                    success: false,
                    message: 'Placa y tipo de vehículo son requeridos'
                });
                return;
            }
            const existingVehicle = await DatabaseService_1.dbService.query('SELECT id FROM vehiculos_parqueadero WHERE placa = ? AND estado = ?', [placa.toUpperCase(), 'ACTIVO']);
            if (existingVehicle.length > 0) {
                res.status(400).json({
                    success: false,
                    message: `El vehículo ${placa} ya se encuentra en el parqueadero`
                });
                return;
            }
            const vehicleType = await DatabaseService_1.dbService.query('SELECT id, nombre, tarifa_hora FROM tipos_vehiculos WHERE nombre = ? AND activo = 1', [tipoVehiculo]);
            if (vehicleType.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Tipo de vehículo no válido'
                });
                return;
            }
            const codigo_barras = this.generateBarcode();
            const result = await DatabaseService_1.dbService.run(`
        INSERT INTO vehiculos_parqueadero 
        (placa, tipo_vehiculo_id, propietario, telefono, codigo_barras, observaciones, usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
                placa.toUpperCase(),
                vehicleType[0].id,
                propietario,
                telefono,
                codigo_barras,
                observaciones,
                req.user?.username || 'sistema'
            ]);
            logger_1.default.info(`Vehicle entry registered: ${placa} with barcode: ${codigo_barras}`);
            res.status(201).json({
                success: true,
                message: 'Vehículo registrado exitosamente',
                data: {
                    id: result.id,
                    placa: placa.toUpperCase(),
                    tipo: vehicleType[0].nombre,
                    codigo_barras,
                    fecha_entrada: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error registering vehicle entry:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async processExit(req, res) {
        try {
            const { placa, codigo_barras, metodo_pago = 'efectivo' } = req.body;
            if (!placa && !codigo_barras) {
                res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar la placa o el código de barras'
                });
                return;
            }
            let vehicle;
            if (codigo_barras) {
                vehicle = await DatabaseService_1.dbService.query(`
          SELECT v.*, tv.nombre as tipo_nombre, tv.tarifa_hora, tv.tarifa_dia
          FROM vehiculos_parqueadero v
          JOIN tipos_vehiculos tv ON v.tipo_vehiculo_id = tv.id
          WHERE v.codigo_barras = ? AND v.estado = 'ACTIVO'
        `, [codigo_barras]);
            }
            else {
                vehicle = await DatabaseService_1.dbService.query(`
          SELECT v.*, tv.nombre as tipo_nombre, tv.tarifa_hora, tv.tarifa_dia
          FROM vehiculos_parqueadero v
          JOIN tipos_vehiculos tv ON v.tipo_vehiculo_id = tv.id
          WHERE v.placa = ? AND v.estado = 'ACTIVO'
        `, [placa.toUpperCase()]);
            }
            if (vehicle.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado o ya procesado'
                });
                return;
            }
            const vehicleData = vehicle[0];
            const entryTime = new Date(vehicleData.fecha_entrada);
            const exitTime = new Date();
            const totalAmount = this.calculateFee(entryTime, exitTime, vehicleData.tarifa_hora, vehicleData.tarifa_dia);
            await DatabaseService_1.dbService.run(`
        UPDATE vehiculos_parqueadero 
        SET fecha_salida = ?, total_pagar = ?, metodo_pago = ?, estado = 'FINALIZADO'
        WHERE id = ?
      `, [
                exitTime.toISOString(),
                totalAmount,
                metodo_pago,
                vehicleData.id
            ]);
            logger_1.default.info(`Vehicle exit processed: ${vehicleData.placa} - Amount: ${totalAmount}`);
            res.json({
                success: true,
                message: 'Salida procesada exitosamente',
                data: {
                    placa: vehicleData.placa,
                    tipo: vehicleData.tipo_nombre,
                    fecha_entrada: vehicleData.fecha_entrada,
                    fecha_salida: exitTime.toISOString(),
                    total_pagar: totalAmount,
                    metodo_pago,
                    tiempo_permanencia: Math.ceil((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error processing vehicle exit:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getActiveVehicles(req, res) {
        try {
            const vehicles = await DatabaseService_1.dbService.query(`
        SELECT v.*, tv.nombre as tipo_nombre, tv.tarifa_hora
        FROM vehiculos_parqueadero v
        JOIN tipos_vehiculos tv ON v.tipo_vehiculo_id = tv.id
        WHERE v.estado = 'ACTIVO'
        ORDER BY v.fecha_entrada DESC
      `);
            res.json({
                success: true,
                data: vehicles,
                total: vehicles.length
            });
        }
        catch (error) {
            logger_1.default.error('Error getting active vehicles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async getParkingHistory(req, res) {
        try {
            const { page = 1, limit = 50, placa, fecha_desde, fecha_hasta } = req.query;
            let whereClause = '1=1';
            const params = [];
            if (placa) {
                whereClause += ' AND v.placa LIKE ?';
                params.push(`%${placa}%`);
            }
            if (fecha_desde) {
                whereClause += ' AND DATE(v.fecha_entrada) >= ?';
                params.push(fecha_desde);
            }
            if (fecha_hasta) {
                whereClause += ' AND DATE(v.fecha_entrada) <= ?';
                params.push(fecha_hasta);
            }
            const offset = (Number(page) - 1) * Number(limit);
            params.push(Number(limit), offset);
            const vehicles = await DatabaseService_1.dbService.query(`
        SELECT v.*, tv.nombre as tipo_nombre
        FROM vehiculos_parqueadero v
        JOIN tipos_vehiculos tv ON v.tipo_vehiculo_id = tv.id
        WHERE ${whereClause}
        ORDER BY v.fecha_entrada DESC
        LIMIT ? OFFSET ?
      `, params);
            const totalResult = await DatabaseService_1.dbService.query(`
        SELECT COUNT(*) as total
        FROM vehiculos_parqueadero v
        JOIN tipos_vehiculos tv ON v.tipo_vehiculo_id = tv.id
        WHERE ${whereClause}
      `, params.slice(0, -2));
            res.json({
                success: true,
                data: vehicles,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalResult[0].total,
                    pages: Math.ceil(totalResult[0].total / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting parking history:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async getParkingStats(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayVehicles = await DatabaseService_1.dbService.query(`
        SELECT COUNT(*) as total FROM vehiculos_parqueadero 
        WHERE DATE(fecha_entrada) = ?
      `, [today]);
            const currentlyParked = await DatabaseService_1.dbService.query(`
        SELECT COUNT(*) as total FROM vehiculos_parqueadero 
        WHERE estado = 'ACTIVO'
      `);
            const todayRevenue = await DatabaseService_1.dbService.query(`
        SELECT COALESCE(SUM(total_pagar), 0) as total FROM vehiculos_parqueadero 
        WHERE DATE(fecha_entrada) = ? AND estado = 'FINALIZADO'
      `, [today]);
            const vehicleTypes = await DatabaseService_1.dbService.query(`
        SELECT tv.nombre, COUNT(v.id) as cantidad
        FROM tipos_vehiculos tv
        LEFT JOIN vehiculos_parqueadero v ON tv.id = v.tipo_vehiculo_id 
          AND v.estado = 'ACTIVO'
        WHERE tv.activo = 1
        GROUP BY tv.id, tv.nombre
      `);
            res.json({
                success: true,
                data: {
                    today_entries: todayVehicles[0].total,
                    currently_parked: currentlyParked[0].total,
                    today_revenue: todayRevenue[0].total,
                    vehicle_types: vehicleTypes
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting parking stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.ParkingController = ParkingController;
//# sourceMappingURL=ParkingController.js.map