"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LavaderoController = void 0;
const ParkingModels_1 = require("../models/ParkingModels");
const logger_1 = __importDefault(require("../utils/logger"));
class LavaderoController {
    generarCodigoBarras(prefijo = 'LV') {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefijo}${timestamp.slice(-6)}${random}`;
    }
    async crearOrdenServicio(req, res) {
        try {
            const { placa, tipo_vehiculo_id, servicios, observaciones = '', usuario = 'sistema' } = req.body;
            if (!placa || !tipo_vehiculo_id) {
                res.status(400).json({
                    success: false,
                    message: 'Placa y tipo de vehículo son requeridos'
                });
                return;
            }
            if (!servicios || servicios.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Debe seleccionar al menos un servicio'
                });
                return;
            }
            const tipoVehiculo = await ParkingModels_1.TipoVehiculo.findById(tipo_vehiculo_id);
            if (!tipoVehiculo || !tipoVehiculo.activo) {
                res.status(400).json({
                    success: false,
                    message: 'Tipo de vehículo no válido'
                });
                return;
            }
            let totalServicios = 0;
            let tiempoEstimado = 0;
            const serviciosValidos = [];
            for (const servicio of servicios) {
                const servicioInfo = await ParkingModels_1.ServicioLavadero.findById(servicio.id);
                if (!servicioInfo || !servicioInfo.activo) {
                    res.status(400).json({
                        success: false,
                        message: `Servicio ID ${servicio.id} no válido`
                    });
                    return;
                }
                const cantidad = servicio.cantidad || 1;
                const subtotal = servicioInfo.precio * cantidad;
                serviciosValidos.push({
                    servicio_id: servicioInfo._id,
                    cantidad,
                    precio_unitario: servicioInfo.precio,
                    subtotal
                });
                totalServicios += subtotal;
                tiempoEstimado += servicioInfo.duracion_estimada * cantidad;
            }
            const codigoBarras = this.generarCodigoBarras('LV');
            const orden = new ParkingModels_1.OrdenLavadero({
                placa: placa.toUpperCase(),
                tipo_vehiculo_id,
                codigo_barras: codigoBarras,
                servicios: serviciosValidos,
                total_servicios: totalServicios,
                tiempo_estimado: tiempoEstimado,
                observaciones,
                usuario
            });
            await orden.save();
            const log = new ParkingModels_1.LogSistema({
                usuario,
                accion: 'CREAR_ORDEN_LAVADERO',
                modulo: 'LAVADERO',
                descripcion: `Placa: ${placa}, Servicios: ${serviciosValidos.length}, Total: $${totalServicios}`,
                datos_adicionales: { total_servicios: totalServicios, tiempo_estimado: tiempoEstimado },
                ip: req.ip
            });
            await log.save();
            logger_1.default.info('Orden de lavadero creada', {
                placa: placa.toUpperCase(),
                codigo_barras: codigoBarras,
                total_servicios: totalServicios,
                tiempo_estimado: tiempoEstimado
            });
            res.json({
                success: true,
                data: {
                    id: orden._id,
                    placa: orden.placa,
                    codigo_barras: orden.codigo_barras,
                    fecha_servicio: orden.fecha_servicio,
                    servicios: serviciosValidos,
                    total_servicios: totalServicios,
                    tiempo_estimado: tiempoEstimado,
                    estado: orden.estado
                },
                message: 'Orden de servicio creada exitosamente'
            });
        }
        catch (error) {
            logger_1.default.error('Error creando orden de lavadero:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async actualizarEstadoOrden(req, res) {
        try {
            const { orden_id } = req.params;
            const { estado, usuario = 'sistema' } = req.body;
            const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'];
            if (!estadosValidos.includes(estado)) {
                res.status(400).json({
                    success: false,
                    message: 'Estado no válido'
                });
                return;
            }
            const orden = await ParkingModels_1.OrdenLavadero.findById(orden_id);
            if (!orden) {
                res.status(404).json({
                    success: false,
                    message: 'Orden no encontrada'
                });
                return;
            }
            const estadoAnterior = orden.estado;
            orden.estado = estado;
            if (estado === 'EN_PROCESO' && !orden.fecha_inicio) {
                orden.fecha_inicio = new Date();
            }
            else if ((estado === 'TERMINADO' || estado === 'ENTREGADO') && !orden.fecha_finalizacion) {
                orden.fecha_finalizacion = new Date();
                orden.usuario_finalizacion = usuario;
            }
            await orden.save();
            const log = new ParkingModels_1.LogSistema({
                usuario,
                accion: 'ACTUALIZAR_ESTADO_LAVADERO',
                modulo: 'LAVADERO',
                descripcion: `Orden ${orden_id}: ${estadoAnterior} -> ${estado}`,
                datos_adicionales: { estado_anterior: estadoAnterior, estado_nuevo: estado },
                ip: req.ip
            });
            await log.save();
            logger_1.default.info('Estado de orden actualizado', {
                orden_id,
                estado_anterior: estadoAnterior,
                estado_nuevo: estado
            });
            res.json({
                success: true,
                data: {
                    id: orden._id,
                    estado: orden.estado,
                    fecha_inicio: orden.fecha_inicio,
                    fecha_finalizacion: orden.fecha_finalizacion
                },
                message: 'Estado actualizado exitosamente'
            });
        }
        catch (error) {
            logger_1.default.error('Error actualizando estado de orden:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerOrdenesActivas(req, res) {
        try {
            const ordenes = await ParkingModels_1.OrdenLavadero.find({
                estado: { $in: ['PENDIENTE', 'EN_PROCESO'] }
            })
                .populate('tipo_vehiculo_id')
                .populate('servicios.servicio_id')
                .sort({ fecha_servicio: -1 });
            const ordenesFormateadas = ordenes.map(orden => ({
                id: orden._id,
                placa: orden.placa,
                tipo_vehiculo: orden.tipo_vehiculo_id.nombre,
                fecha_servicio: orden.fecha_servicio,
                fecha_inicio: orden.fecha_inicio,
                codigo_barras: orden.codigo_barras,
                servicios: orden.servicios.map(s => ({
                    nombre: s.servicio_id.nombre,
                    cantidad: s.cantidad,
                    precio_unitario: s.precio_unitario,
                    subtotal: s.subtotal
                })),
                total_servicios: orden.total_servicios,
                tiempo_estimado: orden.tiempo_estimado,
                estado: orden.estado,
                observaciones: orden.observaciones,
                tiempo_transcurrido: orden.fecha_inicio ?
                    Math.ceil((Date.now() - orden.fecha_inicio.getTime()) / (1000 * 60)) : null
            }));
            res.json({
                success: true,
                data: ordenesFormateadas,
                total: ordenesFormateadas.length
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo órdenes activas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerEstadisticasLavadero(req, res) {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(hoy.getDate() + 1);
            const ordenesHoy = await ParkingModels_1.OrdenLavadero.find({
                fecha_servicio: { $gte: hoy, $lt: manana }
            });
            const ordenesPendientes = await ParkingModels_1.OrdenLavadero.countDocuments({ estado: 'PENDIENTE' });
            const ordenesEnProceso = await ParkingModels_1.OrdenLavadero.countDocuments({ estado: 'EN_PROCESO' });
            const ordenesTerminadas = await ParkingModels_1.OrdenLavadero.countDocuments({ estado: 'TERMINADO' });
            const ingresosHoy = ordenesHoy
                .filter(o => ['TERMINADO', 'ENTREGADO'].includes(o.estado))
                .reduce((total, o) => total + o.total_servicios, 0);
            const serviciosMasSolicitados = await ParkingModels_1.OrdenLavadero.aggregate([
                { $match: { fecha_servicio: { $gte: hoy, $lt: manana } } },
                { $unwind: '$servicios' },
                { $group: {
                        _id: '$servicios.servicio_id',
                        total_cantidad: { $sum: '$servicios.cantidad' },
                        total_ingresos: { $sum: '$servicios.subtotal' }
                    } },
                { $sort: { total_cantidad: -1 } },
                { $limit: 5 }
            ]);
            res.json({
                success: true,
                data: {
                    ordenes_hoy: ordenesHoy.length,
                    ingresos_hoy: ingresosHoy,
                    ordenes_pendientes: ordenesPendientes,
                    ordenes_en_proceso: ordenesEnProceso,
                    ordenes_terminadas: ordenesTerminadas,
                    promedio_tiempo: ordenesHoy.length > 0 ?
                        ordenesHoy.reduce((sum, o) => sum + (o.tiempo_estimado || 0), 0) / ordenesHoy.length : 0,
                    servicios_populares: serviciosMasSolicitados
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo estadísticas del lavadero:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async buscarOrden(req, res) {
        try {
            const { codigo_barras, placa } = req.query;
            if (!codigo_barras && !placa) {
                res.status(400).json({
                    success: false,
                    message: 'Código de barras o placa son requeridos'
                });
                return;
            }
            const filtro = {};
            if (codigo_barras) {
                filtro.codigo_barras = codigo_barras;
            }
            else {
                filtro.placa = placa.toUpperCase();
            }
            const orden = await ParkingModels_1.OrdenLavadero.findOne(filtro)
                .populate('tipo_vehiculo_id')
                .populate('servicios.servicio_id')
                .sort({ fecha_servicio: -1 });
            if (!orden) {
                res.status(404).json({
                    success: false,
                    message: 'Orden no encontrada'
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    id: orden._id,
                    placa: orden.placa,
                    tipo_vehiculo: orden.tipo_vehiculo_id.nombre,
                    fecha_servicio: orden.fecha_servicio,
                    fecha_inicio: orden.fecha_inicio,
                    fecha_finalizacion: orden.fecha_finalizacion,
                    codigo_barras: orden.codigo_barras,
                    servicios: orden.servicios.map(s => ({
                        nombre: s.servicio_id.nombre,
                        cantidad: s.cantidad,
                        precio_unitario: s.precio_unitario,
                        subtotal: s.subtotal
                    })),
                    total_servicios: orden.total_servicios,
                    tiempo_estimado: orden.tiempo_estimado,
                    estado: orden.estado,
                    observaciones: orden.observaciones,
                    tiempo_transcurrido: orden.fecha_inicio && !orden.fecha_finalizacion ?
                        Math.ceil((Date.now() - orden.fecha_inicio.getTime()) / (1000 * 60)) : null
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error buscando orden:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerServicios(req, res) {
        try {
            const servicios = await ParkingModels_1.ServicioLavadero.find({ activo: true })
                .sort({ nombre: 1 });
            res.json({
                success: true,
                data: servicios.map(s => ({
                    id: s._id,
                    nombre: s.nombre,
                    descripcion: s.descripcion,
                    precio: s.precio,
                    duracion_estimada: s.duracion_estimada
                }))
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo servicios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.LavaderoController = LavaderoController;
//# sourceMappingURL=LavaderoController.js.map