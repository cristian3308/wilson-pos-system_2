"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracionController = void 0;
const ParkingModels_1 = require("../models/ParkingModels");
const logger_1 = __importDefault(require("../utils/logger"));
class ConfiguracionController {
    async inicializarDatos(req, res) {
        try {
            const tiposExistentes = await ParkingModels_1.TipoVehiculo.countDocuments();
            const serviciosExistentes = await ParkingModels_1.ServicioLavadero.countDocuments();
            if (tiposExistentes > 0 && serviciosExistentes > 0) {
                res.json({
                    success: true,
                    message: 'Los datos ya están inicializados',
                    data: {
                        tipos_vehiculos: tiposExistentes,
                        servicios_lavadero: serviciosExistentes
                    }
                });
                return;
            }
            const tiposVehiculos = [
                {
                    nombre: 'Automóvil',
                    precio_hora: 3000,
                    precio_fraccion: 1000,
                    minutos_fraccion: 15
                },
                {
                    nombre: 'Motocicleta',
                    precio_hora: 2000,
                    precio_fraccion: 500,
                    minutos_fraccion: 15
                },
                {
                    nombre: 'Camioneta',
                    precio_hora: 4000,
                    precio_fraccion: 1500,
                    minutos_fraccion: 15
                },
                {
                    nombre: 'Bicicleta',
                    precio_hora: 1000,
                    precio_fraccion: 300,
                    minutos_fraccion: 30
                }
            ];
            if (tiposExistentes === 0) {
                await ParkingModels_1.TipoVehiculo.insertMany(tiposVehiculos);
                logger_1.default.info('Tipos de vehículos inicializados');
            }
            const serviciosLavadero = [
                {
                    nombre: 'Lavado Básico',
                    descripcion: 'Lavado exterior básico con agua y jabón',
                    precio: 8000,
                    duracion_estimada: 20
                },
                {
                    nombre: 'Lavado Completo',
                    descripcion: 'Lavado exterior e interior completo',
                    precio: 15000,
                    duracion_estimada: 45
                },
                {
                    nombre: 'Encerado',
                    descripcion: 'Aplicación de cera protectora',
                    precio: 12000,
                    duracion_estimada: 30
                },
                {
                    nombre: 'Aspirado',
                    descripcion: 'Limpieza interior con aspiradora',
                    precio: 5000,
                    duracion_estimada: 15
                },
                {
                    nombre: 'Lavado Motor',
                    descripcion: 'Limpieza y desengrease del motor',
                    precio: 10000,
                    duracion_estimada: 25
                },
                {
                    nombre: 'Lavado Premium',
                    descripcion: 'Servicio completo con encerado y aromatización',
                    precio: 25000,
                    duracion_estimada: 60
                }
            ];
            if (serviciosExistentes === 0) {
                await ParkingModels_1.ServicioLavadero.insertMany(serviciosLavadero);
                logger_1.default.info('Servicios de lavadero inicializados');
            }
            const configuraciones = [
                {
                    clave: 'nombre_empresa',
                    valor: 'Parqueadero y Lavadero POS',
                    descripcion: 'Nombre de la empresa',
                    categoria: 'empresa'
                },
                {
                    clave: 'espacios_parqueadero',
                    valor: 50,
                    descripcion: 'Número total de espacios de parqueadero',
                    categoria: 'parqueadero'
                },
                {
                    clave: 'moneda',
                    valor: 'COP',
                    descripcion: 'Moneda del sistema',
                    categoria: 'general'
                },
                {
                    clave: 'timezone',
                    valor: 'America/Bogota',
                    descripcion: 'Zona horaria del sistema',
                    categoria: 'general'
                }
            ];
            for (const config of configuraciones) {
                await ParkingModels_1.Configuracion.findOneAndUpdate({ clave: config.clave }, config, { upsert: true, new: true });
            }
            logger_1.default.info('Sistema inicializado correctamente');
            res.json({
                success: true,
                message: 'Sistema inicializado correctamente',
                data: {
                    tipos_vehiculos: tiposVehiculos.length,
                    servicios_lavadero: serviciosLavadero.length,
                    configuraciones: configuraciones.length
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error inicializando datos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerTiposVehiculos(req, res) {
        try {
            const tipos = await ParkingModels_1.TipoVehiculo.find({ activo: true }).sort({ nombre: 1 });
            res.json({
                success: true,
                data: tipos.map(t => ({
                    id: t._id,
                    nombre: t.nombre,
                    precio_hora: t.precio_hora,
                    precio_fraccion: t.precio_fraccion,
                    minutos_fraccion: t.minutos_fraccion
                }))
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo tipos de vehículos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerConfiguracion(req, res) {
        try {
            const configuraciones = await ParkingModels_1.Configuracion.find();
            const config = configuraciones.reduce((acc, curr) => {
                acc[curr.clave] = curr.valor;
                return acc;
            }, {});
            res.json({
                success: true,
                data: config
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo configuración:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async actualizarConfiguracion(req, res) {
        try {
            const { configuraciones } = req.body;
            if (!configuraciones || typeof configuraciones !== 'object') {
                res.status(400).json({
                    success: false,
                    message: 'Configuraciones no válidas'
                });
                return;
            }
            const actualizaciones = [];
            for (const [clave, valor] of Object.entries(configuraciones)) {
                const resultado = await ParkingModels_1.Configuracion.findOneAndUpdate({ clave }, { valor, clave }, { upsert: true, new: true });
                actualizaciones.push(resultado);
            }
            logger_1.default.info('Configuración actualizada', { configuraciones });
            res.json({
                success: true,
                message: 'Configuración actualizada correctamente',
                data: actualizaciones
            });
        }
        catch (error) {
            logger_1.default.error('Error actualizando configuración:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerEstadisticasCompletas(req, res) {
        try {
            const { VehiculoParqueadero, OrdenLavadero } = require('../models/ParkingModels');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(hoy.getDate() + 1);
            const vehiculosActivos = await VehiculoParqueadero.countDocuments({ estado: 'ACTIVO' });
            const vehiculosHoy = await VehiculoParqueadero.find({
                fecha_entrada: { $gte: hoy, $lt: manana }
            });
            const ingresosParqueadero = vehiculosHoy
                .filter((v) => v.total_pago)
                .reduce((total, v) => total + (v.total_pago || 0), 0);
            const ordenesActivas = await OrdenLavadero.countDocuments({
                estado: { $in: ['PENDIENTE', 'EN_PROCESO'] }
            });
            const ordenesHoy = await OrdenLavadero.find({
                fecha_servicio: { $gte: hoy, $lt: manana }
            });
            const ingresosLavadero = ordenesHoy
                .filter((o) => ['TERMINADO', 'ENTREGADO'].includes(o.estado))
                .reduce((total, o) => total + o.total_servicios, 0);
            const configuraciones = await ParkingModels_1.Configuracion.find();
            const espaciosTotal = configuraciones.find(c => c.clave === 'espacios_parqueadero')?.valor || 50;
            res.json({
                success: true,
                data: {
                    parqueadero: {
                        vehiculos_activos: vehiculosActivos,
                        espacios_disponibles: espaciosTotal - vehiculosActivos,
                        espacios_total: espaciosTotal,
                        ocupacion_porcentaje: Math.round((vehiculosActivos / espaciosTotal) * 100),
                        vehiculos_hoy: vehiculosHoy.length,
                        ingresos_hoy: ingresosParqueadero
                    },
                    lavadero: {
                        ordenes_activas: ordenesActivas,
                        ordenes_hoy: ordenesHoy.length,
                        ingresos_hoy: ingresosLavadero,
                        ordenes_pendientes: await OrdenLavadero.countDocuments({ estado: 'PENDIENTE' }),
                        ordenes_en_proceso: await OrdenLavadero.countDocuments({ estado: 'EN_PROCESO' })
                    },
                    general: {
                        ingresos_totales_hoy: ingresosParqueadero + ingresosLavadero,
                        fecha_consulta: new Date()
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo estadísticas completas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    async obtenerResumenDiario(req, res) {
        try {
            if (process.env.DEMO_MODE !== 'false') {
                const hoy = new Date();
                const resumenDemo = {
                    fecha: hoy.toISOString().split('T')[0],
                    ingresosParqueadero: 145000,
                    ingresosLavadero: 95000,
                    ingresosTotales: 240000,
                    vehiculosPorTipo: [
                        { _id: 'Carro', cantidad: 15 },
                        { _id: 'Moto', cantidad: 8 },
                        { _id: 'Camioneta', cantidad: 3 }
                    ],
                    estadisticas: {
                        vehiculosEstacionados: 12,
                        espaciosDisponibles: 8,
                        totalEspacios: 20,
                        serviciosLavado: 5,
                        ocupacionPromedio: 60,
                        tiempoPromedioEstadia: 4.5
                    }
                };
                logger_1.default.info('Resumen diario generado en modo demo');
                res.json({
                    success: true,
                    data: resumenDemo,
                    message: 'Resumen diario obtenido exitosamente (modo demo)'
                });
                return;
            }
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);
            const ingresosDiaParqueadero = await ParkingModels_1.VehiculoParqueadero.aggregate([
                {
                    $match: {
                        fechaSalida: { $gte: hoy, $lt: manana }
                    }
                },
                { $group: { _id: null, total: { $sum: '$valorPagar' } } }
            ]);
            const ingresosDiaLavadero = await ParkingModels_1.OrdenLavadero.aggregate([
                {
                    $match: {
                        fechaCreacion: { $gte: hoy, $lt: manana },
                        estado: 'COMPLETADO'
                    }
                },
                { $group: { _id: null, total: { $sum: '$valorTotal' } } }
            ]);
            const vehiculosPorTipo = await ParkingModels_1.VehiculoParqueadero.aggregate([
                {
                    $match: {
                        fechaEntrada: { $gte: hoy, $lt: manana }
                    }
                },
                {
                    $lookup: {
                        from: 'tipovehiculos',
                        localField: 'tipoVehiculo',
                        foreignField: '_id',
                        as: 'tipo'
                    }
                },
                { $unwind: '$tipo' },
                {
                    $group: {
                        _id: '$tipo.nombre',
                        cantidad: { $sum: 1 }
                    }
                }
            ]);
            res.json({
                success: true,
                data: {
                    fecha: hoy.toISOString().split('T')[0],
                    ingresosParqueadero: ingresosDiaParqueadero[0]?.total || 0,
                    ingresosLavadero: ingresosDiaLavadero[0]?.total || 0,
                    ingresosTotales: (ingresosDiaParqueadero[0]?.total || 0) + (ingresosDiaLavadero[0]?.total || 0),
                    vehiculosPorTipo
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error al obtener resumen diario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.ConfiguracionController = ConfiguracionController;
//# sourceMappingURL=ConfiguracionController.js.map