"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarwashController = void 0;
const DatabaseService_1 = require("../services/DatabaseService");
const logger_1 = __importDefault(require("../utils/logger"));
class CarwashController {
    generateOrderNumber() {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `LAV${timestamp}${random}`;
    }
    async getServices(req, res) {
        try {
            const services = await DatabaseService_1.dbService.query(`
        SELECT * FROM servicios_lavadero 
        WHERE activo = 1 
        ORDER BY categoria, precio
      `);
            res.json({
                success: true,
                data: services,
                total: services.length
            });
        }
        catch (error) {
            logger_1.default.error('Error getting carwash services:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async createOrder(req, res) {
        try {
            const { placa, tipoVehiculo, propietario = '', telefono = '', servicios = [], observaciones = '' } = req.body;
            if (!placa || !tipoVehiculo || !servicios || servicios.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Placa, tipo de vehículo y servicios son requeridos'
                });
                return;
            }
            const vehicleType = await DatabaseService_1.dbService.query('SELECT id, nombre FROM tipos_vehiculos WHERE nombre = ? AND activo = 1', [tipoVehiculo]);
            if (vehicleType.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Tipo de vehículo no válido'
                });
                return;
            }
            let totalAmount = 0;
            const serviceDetails = [];
            for (const servicioId of servicios) {
                const service = await DatabaseService_1.dbService.query('SELECT id, nombre, precio FROM servicios_lavadero WHERE id = ? AND activo = 1', [servicioId]);
                if (service.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: `Servicio con ID ${servicioId} no encontrado`
                    });
                    return;
                }
                serviceDetails.push(service[0]);
                totalAmount += service[0].precio;
            }
            const numeroOrden = this.generateOrderNumber();
            const orderResult = await DatabaseService_1.dbService.run(`
        INSERT INTO ordenes_lavadero 
        (numero_orden, placa, tipo_vehiculo_id, propietario, telefono, total, observaciones, usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
                numeroOrden,
                placa.toUpperCase(),
                vehicleType[0].id,
                propietario,
                telefono,
                totalAmount,
                observaciones,
                req.user?.username || 'sistema'
            ]);
            for (const service of serviceDetails) {
                await DatabaseService_1.dbService.run(`
          INSERT INTO orden_servicios (orden_id, servicio_id, precio)
          VALUES (?, ?, ?)
        `, [orderResult.id, service.id, service.precio]);
            }
            logger_1.default.info(`Carwash order created: ${numeroOrden} for vehicle: ${placa}`);
            res.status(201).json({
                success: true,
                message: 'Orden de lavadero creada exitosamente',
                data: {
                    id: orderResult.id,
                    numero_orden: numeroOrden,
                    placa: placa.toUpperCase(),
                    tipo_vehiculo: vehicleType[0].nombre,
                    servicios: serviceDetails,
                    total: totalAmount,
                    estado: 'PENDIENTE',
                    fecha_creacion: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error creating carwash order:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getOrders(req, res) {
        try {
            const { page = 1, limit = 50, estado, placa, fecha_desde, fecha_hasta } = req.query;
            let whereClause = '1=1';
            const params = [];
            if (estado) {
                whereClause += ' AND o.estado = ?';
                params.push(estado);
            }
            if (placa) {
                whereClause += ' AND o.placa LIKE ?';
                params.push(`%${placa}%`);
            }
            if (fecha_desde) {
                whereClause += ' AND DATE(o.fecha_creacion) >= ?';
                params.push(fecha_desde);
            }
            if (fecha_hasta) {
                whereClause += ' AND DATE(o.fecha_creacion) <= ?';
                params.push(fecha_hasta);
            }
            const offset = (Number(page) - 1) * Number(limit);
            params.push(Number(limit), offset);
            const orders = await DatabaseService_1.dbService.query(`
        SELECT o.*, tv.nombre as tipo_vehiculo_nombre
        FROM ordenes_lavadero o
        JOIN tipos_vehiculos tv ON o.tipo_vehiculo_id = tv.id
        WHERE ${whereClause}
        ORDER BY o.fecha_creacion DESC
        LIMIT ? OFFSET ?
      `, params);
            for (const order of orders) {
                const services = await DatabaseService_1.dbService.query(`
          SELECT s.nombre, s.precio, os.precio as precio_aplicado
          FROM orden_servicios os
          JOIN servicios_lavadero s ON os.servicio_id = s.id
          WHERE os.orden_id = ?
        `, [order.id]);
                order.servicios = services;
            }
            const totalResult = await DatabaseService_1.dbService.query(`
        SELECT COUNT(*) as total
        FROM ordenes_lavadero o
        JOIN tipos_vehiculos tv ON o.tipo_vehiculo_id = tv.id
        WHERE ${whereClause}
      `, params.slice(0, -2));
            res.json({
                success: true,
                data: orders,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalResult[0].total,
                    pages: Math.ceil(totalResult[0].total / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting carwash orders:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { estado, metodo_pago } = req.body;
            if (!estado || !['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'CANCELADO'].includes(estado)) {
                res.status(400).json({
                    success: false,
                    message: 'Estado no válido'
                });
                return;
            }
            const order = await DatabaseService_1.dbService.query('SELECT * FROM ordenes_lavadero WHERE id = ?', [id]);
            if (order.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Orden no encontrada'
                });
                return;
            }
            let updateFields = 'estado = ?';
            const updateParams = [estado];
            if (estado === 'EN_PROCESO' && !order[0].fecha_inicio) {
                updateFields += ', fecha_inicio = ?';
                updateParams.push(new Date().toISOString());
            }
            else if (estado === 'TERMINADO') {
                updateFields += ', fecha_finalizacion = ?';
                updateParams.push(new Date().toISOString());
                if (metodo_pago) {
                    updateFields += ', metodo_pago = ?';
                    updateParams.push(metodo_pago);
                }
            }
            updateParams.push(id);
            await DatabaseService_1.dbService.run(`
        UPDATE ordenes_lavadero 
        SET ${updateFields}
        WHERE id = ?
      `, updateParams);
            logger_1.default.info(`Carwash order ${id} status updated to: ${estado}`);
            res.json({
                success: true,
                message: 'Estado de la orden actualizado exitosamente',
                data: {
                    id: Number(id),
                    estado,
                    fecha_actualizacion: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error updating order status:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async getCarwashStats(req, res) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = await DatabaseService_1.dbService.query(`
        SELECT COUNT(*) as total FROM ordenes_lavadero 
        WHERE DATE(fecha_creacion) = ?
      `, [today]);
            const ordersByStatus = await DatabaseService_1.dbService.query(`
        SELECT estado, COUNT(*) as cantidad
        FROM ordenes_lavadero
        WHERE DATE(fecha_creacion) = ?
        GROUP BY estado
      `, [today]);
            const todayRevenue = await DatabaseService_1.dbService.query(`
        SELECT COALESCE(SUM(total), 0) as total FROM ordenes_lavadero 
        WHERE DATE(fecha_creacion) = ? AND estado = 'TERMINADO'
      `, [today]);
            const popularServices = await DatabaseService_1.dbService.query(`
        SELECT s.nombre, COUNT(os.servicio_id) as cantidad, SUM(os.precio) as ingresos
        FROM orden_servicios os
        JOIN servicios_lavadero s ON os.servicio_id = s.id
        JOIN ordenes_lavadero o ON os.orden_id = o.id
        WHERE DATE(o.fecha_creacion) >= DATE('now', '-30 days')
        GROUP BY s.id, s.nombre
        ORDER BY cantidad DESC
        LIMIT 5
      `);
            res.json({
                success: true,
                data: {
                    today_orders: todayOrders[0].total,
                    today_revenue: todayRevenue[0].total,
                    orders_by_status: ordersByStatus,
                    popular_services: popularServices
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error getting carwash stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.CarwashController = CarwashController;
//# sourceMappingURL=CarwashController.js.map