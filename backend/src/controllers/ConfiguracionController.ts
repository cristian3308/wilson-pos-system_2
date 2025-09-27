import { Request, Response } from 'express';
import { TipoVehiculo, ServicioLavadero, Configuracion, VehiculoParqueadero, OrdenLavadero } from '../models/ParkingModels';
import logger from '../utils/logger';

export class ConfiguracionController {

  // Inicializar datos básicos del sistema
  async inicializarDatos(req: Request, res: Response): Promise<void> {
    try {
      // Verificar si ya existen datos
      const tiposExistentes = await TipoVehiculo.countDocuments();
      const serviciosExistentes = await ServicioLavadero.countDocuments();

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

      // Crear tipos de vehículos básicos
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
        await TipoVehiculo.insertMany(tiposVehiculos);
        logger.info('Tipos de vehículos inicializados');
      }

      // Crear servicios de lavadero básicos
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
        await ServicioLavadero.insertMany(serviciosLavadero);
        logger.info('Servicios de lavadero inicializados');
      }

      // Crear configuraciones básicas del sistema
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
        await Configuracion.findOneAndUpdate(
          { clave: config.clave },
          config,
          { upsert: true, new: true }
        );
      }

      logger.info('Sistema inicializado correctamente');

      res.json({
        success: true,
        message: 'Sistema inicializado correctamente',
        data: {
          tipos_vehiculos: tiposVehiculos.length,
          servicios_lavadero: serviciosLavadero.length,
          configuraciones: configuraciones.length
        }
      });

    } catch (error) {
      logger.error('Error inicializando datos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener tipos de vehículos
  async obtenerTiposVehiculos(req: Request, res: Response): Promise<void> {
    try {
      const tipos = await TipoVehiculo.find({ activo: true }).sort({ nombre: 1 });

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

    } catch (error) {
      logger.error('Error obteniendo tipos de vehículos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener configuración del sistema
  async obtenerConfiguracion(req: Request, res: Response): Promise<void> {
    try {
      const configuraciones = await Configuracion.find();

      const config = configuraciones.reduce((acc, curr) => {
        acc[curr.clave] = curr.valor;
        return acc;
      }, {} as any);

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      logger.error('Error obteniendo configuración:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar configuración
  async actualizarConfiguracion(req: Request, res: Response): Promise<void> {
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
        const resultado = await Configuracion.findOneAndUpdate(
          { clave },
          { valor, clave },
          { upsert: true, new: true }
        );
        actualizaciones.push(resultado);
      }

      logger.info('Configuración actualizada', { configuraciones });

      res.json({
        success: true,
        message: 'Configuración actualizada correctamente',
        data: actualizaciones
      });

    } catch (error) {
      logger.error('Error actualizando configuración:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas completas del sistema
  async obtenerEstadisticasCompletas(req: Request, res: Response): Promise<void> {
    try {
      // Importar modelos aquí para evitar dependencias circulares
      const { VehiculoParqueadero, OrdenLavadero } = require('../models/ParkingModels');

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);

      // Estadísticas de parqueadero
      const vehiculosActivos = await VehiculoParqueadero.countDocuments({ estado: 'ACTIVO' });
      const vehiculosHoy = await VehiculoParqueadero.find({
        fecha_entrada: { $gte: hoy, $lt: manana }
      });
      const ingresosParqueadero = vehiculosHoy
        .filter((v: any) => v.total_pago)
        .reduce((total: number, v: any) => total + (v.total_pago || 0), 0);

      // Estadísticas de lavadero
      const ordenesActivas = await OrdenLavadero.countDocuments({
        estado: { $in: ['PENDIENTE', 'EN_PROCESO'] }
      });
      const ordenesHoy = await OrdenLavadero.find({
        fecha_servicio: { $gte: hoy, $lt: manana }
      });
      const ingresosLavadero = ordenesHoy
        .filter((o: any) => ['TERMINADO', 'ENTREGADO'].includes(o.estado))
        .reduce((total: number, o: any) => total + o.total_servicios, 0);

      // Configuración del sistema
      const configuraciones = await Configuracion.find();
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

    } catch (error) {
      logger.error('Error obteniendo estadísticas completas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener resumen diario
  async obtenerResumenDiario(req: Request, res: Response): Promise<void> {
    try {
      // En modo demo, retornamos datos simulados
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

        logger.info('Resumen diario generado en modo demo');
        res.json({
          success: true,
          data: resumenDemo,
          message: 'Resumen diario obtenido exitosamente (modo demo)'
        });
        return;
      }

      // Código original para modo producción con MongoDB
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      // Ingresos del día - parqueadero
      const ingresosDiaParqueadero = await VehiculoParqueadero.aggregate([
        { 
          $match: { 
            fechaSalida: { $gte: hoy, $lt: manana }
          } 
        },
        { $group: { _id: null, total: { $sum: '$valorPagar' } } }
      ]);

      // Ingresos del día - lavadero
      const ingresosDiaLavadero = await OrdenLavadero.aggregate([
        { 
          $match: { 
            fechaCreacion: { $gte: hoy, $lt: manana },
            estado: 'COMPLETADO'
          } 
        },
        { $group: { _id: null, total: { $sum: '$valorTotal' } } }
      ]);

      // Conteo de vehículos por tipo del día
      const vehiculosPorTipo = await VehiculoParqueadero.aggregate([
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
    } catch (error) {
      logger.error('Error al obtener resumen diario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}