"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParqueaderoController = void 0;
const ParkingModels_1 = require("../models/ParkingModels");
const logger_1 = __importDefault(require("../utils/logger"));
class ParqueaderoController {
    generarCodigoBarras(prefijo = 'PK') {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefijo}${timestamp.slice(-6)}${random}`;
    }
    calcularTarifa(fechaEntrada, fechaSalida, precioHora, precioFraccion, minutosFraccion) {
        const tiempoTotal = Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60));
        if (tiempoTotal <= minutosFraccion) {
            return { tiempoTotal, totalPago: precioFraccion };
        }
        const horasCompletas = Math.floor(tiempoTotal / 60);
        const minutosRestantes = tiempoTotal % 60;
        let totalPago = horasCompletas * precioHora;
        if (minutosRestantes > 0) {
            const fraccionesAdicionales = Math.ceil(minutosRestantes / minutosFraccion);
            totalPago += fraccionesAdicionales * precioFraccion;
        }
        return { tiempoTotal, totalPago };
    }
    async registrarEntrada(req, res) {
        try {
            const { placa, tipo_vehiculo_id, usuario = 'sistema' } = req.body;
            if (!placa || !tipo_vehiculo_id) {
                res.status(400).json({
                    success: false,
                    message: 'Placa y tipo de vehículo son requeridos'
                });
                return;
            }
            const vehiculoActivo = await ParkingModels_1.VehiculoParqueadero.findOne({
                placa: placa.toUpperCase(),
                estado: 'ACTIVO'
            });
            if (vehiculoActivo) {
                res.status(400).json({
                    success: false,
                    message: `El vehículo ${placa} ya se encuentra en el parqueadero`
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
            const codigoBarras = this.generarCodigoBarras('PK');
            const vehiculo = new ParkingModels_1.VehiculoParqueadero({
                placa: placa.toUpperCase(),
                tipo_vehiculo_id,
                codigo_barras: codigoBarras,
                precio_hora: tipoVehiculo.precio_hora,
                precio_fraccion: tipoVehiculo.precio_fraccion,
                minutos_fraccion: tipoVehiculo.minutos_fraccion,
                usuario_entrada: usuario
            });
            await vehiculo.save();
            const log = new ParkingModels_1.LogSistema({
                usuario,
                accion: 'ENTRADA_VEHICULO',
                modulo: 'PARQUEADERO',
                descripcion: `Placa: ${placa}, Tipo: ${tipoVehiculo.nombre}, Código: ${codigoBarras}`,
                ip: req.ip
            });
            await log.save();
            logger_1.default.info('Vehículo registrado en parqueadero', {
                placa: placa.toUpperCase(),
                codigo_barras: codigoBarras,
                tipo_vehiculo: tipoVehiculo.nombre,
                usuario
            });
            res.json({
                success: true,
                data: {
                    id: vehiculo._id,
                    placa: vehiculo.placa,
                    tipo_vehiculo: tipoVehiculo.nombre,
                    fecha_entrada: vehiculo.fecha_entrada,
                    codigo_barras: vehiculo.codigo_barras,
                    precio_hora: vehiculo.precio_hora,
                    precio_fraccion: vehiculo.precio_fraccion,
                    minutos_fraccion: vehiculo.minutos_fraccion
                },
                message: 'Vehículo registrado exitosamente'
            });
        }
        catch (error) {
            logger_1.default.error('Error registrando entrada de vehículo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async registrarSalida(req, res) {
        try {
            const { codigo_barras, placa, usuario = 'sistema' } = req.body;
            if (!codigo_barras && !placa) {
                res.status(400).json({
                    success: false,
                    message: 'Código de barras o placa son requeridos'
                });
                return;
            }
            const filtro = { estado: 'ACTIVO' };
            if (codigo_barras) {
                filtro.codigo_barras = codigo_barras;
            }
            else {
                filtro.placa = placa.toUpperCase();
            }
            const vehiculo = await ParkingModels_1.VehiculoParqueadero.findOne(filtro).populate('tipo_vehiculo_id');
            if (!vehiculo) {
                res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado o ya fue procesado'
                });
                return;
            }
            const fechaSalida = new Date();
            const { tiempoTotal, totalPago } = this.calcularTarifa(vehiculo.fecha_entrada, fechaSalida, vehiculo.precio_hora, vehiculo.precio_fraccion, vehiculo.minutos_fraccion);
            vehiculo.fecha_salida = fechaSalida;
            vehiculo.tiempo_total = tiempoTotal;
            vehiculo.total_pago = totalPago;
            vehiculo.estado = 'PAGADO';
            vehiculo.usuario_salida = usuario;
            await vehiculo.save();
            const log = new ParkingModels_1.LogSistema({
                usuario,
                accion: 'SALIDA_VEHICULO',
                modulo: 'PARQUEADERO',
                descripcion: `Placa: ${vehiculo.placa}, Tiempo: ${tiempoTotal} min, Total: $${totalPago}`,
                datos_adicionales: { tiempo_total: tiempoTotal, total_pago: totalPago },
                ip: req.ip
            });
            await log.save();
            logger_1.default.info('Vehículo procesado salida', {
                placa: vehiculo.placa,
                tiempo_total: tiempoTotal,
                total_pago: totalPago
            });
            res.json({
                success: true,
                data: {
                    id: vehiculo._id,
                    placa: vehiculo.placa,
                    tipo_vehiculo: vehiculo.tipo_vehiculo_id.nombre,
                    fecha_entrada: vehiculo.fecha_entrada,
                    fecha_salida: vehiculo.fecha_salida,
                    tiempo_total: tiempoTotal,
                    total_pago: totalPago,
                    codigo_barras: vehiculo.codigo_barras
                },
                message: 'Salida procesada exitosamente'
            });
        }
        catch (error) {
            logger_1.default.error('Error procesando salida de vehículo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerVehiculosActivos(req, res) {
        try {
            const vehiculos = await ParkingModels_1.VehiculoParqueadero.find({ estado: 'ACTIVO' })
                .populate('tipo_vehiculo_id')
                .sort({ fecha_entrada: -1 });
            const vehiculosFormateados = vehiculos.map(vehiculo => ({
                id: vehiculo._id,
                placa: vehiculo.placa,
                tipo_vehiculo: vehiculo.tipo_vehiculo_id.nombre,
                fecha_entrada: vehiculo.fecha_entrada,
                codigo_barras: vehiculo.codigo_barras,
                tiempo_transcurrido: Math.ceil((Date.now() - vehiculo.fecha_entrada.getTime()) / (1000 * 60))
            }));
            res.json({
                success: true,
                data: vehiculosFormateados,
                total: vehiculosFormateados.length
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo vehículos activos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerEstadisticasDia(req, res) {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(hoy.getDate() + 1);
            const vehiculosHoy = await ParkingModels_1.VehiculoParqueadero.find({
                fecha_entrada: { $gte: hoy, $lt: manana }
            });
            const vehiculosActivos = await ParkingModels_1.VehiculoParqueadero.countDocuments({ estado: 'ACTIVO' });
            const ingresosHoy = vehiculosHoy
                .filter(v => v.total_pago)
                .reduce((total, v) => total + (v.total_pago || 0), 0);
            const vehiculosProcesados = vehiculosHoy.filter(v => v.estado === 'PAGADO').length;
            res.json({
                success: true,
                data: {
                    vehiculos_activos: vehiculosActivos,
                    ingresos_hoy: ingresosHoy,
                    vehiculos_hoy: vehiculosHoy.length,
                    vehiculos_procesados: vehiculosProcesados,
                    promedio_tiempo: vehiculosHoy.length > 0 ?
                        vehiculosHoy.reduce((sum, v) => sum + (v.tiempo_total || 0), 0) / vehiculosHoy.length : 0
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo estadísticas del día:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async buscarVehiculo(req, res) {
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
            const vehiculo = await ParkingModels_1.VehiculoParqueadero.findOne(filtro)
                .populate('tipo_vehiculo_id')
                .sort({ fecha_entrada: -1 });
            if (!vehiculo) {
                res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    id: vehiculo._id,
                    placa: vehiculo.placa,
                    tipo_vehiculo: vehiculo.tipo_vehiculo_id.nombre,
                    fecha_entrada: vehiculo.fecha_entrada,
                    fecha_salida: vehiculo.fecha_salida,
                    codigo_barras: vehiculo.codigo_barras,
                    estado: vehiculo.estado,
                    tiempo_total: vehiculo.tiempo_total,
                    total_pago: vehiculo.total_pago,
                    tiempo_transcurrido: vehiculo.estado === 'ACTIVO' ?
                        Math.ceil((Date.now() - vehiculo.fecha_entrada.getTime()) / (1000 * 60)) : null
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error buscando vehículo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.ParqueaderoController = ParqueaderoController;
//# sourceMappingURL=ParqueaderoController.js.map