import { Request, Response } from 'express';
import { TipoVehiculo, VehiculoParqueadero, LogSistema } from '../models/ParkingModels';
import logger from '../utils/logger';

export class ParqueaderoController {
  
  // Generar código de barras único
  private generarCodigoBarras(prefijo: string = 'PK'): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefijo}${timestamp.slice(-6)}${random}`;
  }

  // Calcular tarifa basada en tiempo
  private calcularTarifa(fechaEntrada: Date, fechaSalida: Date, precioHora: number, precioFraccion: number, minutosFraccion: number): { tiempoTotal: number, totalPago: number } {
    const tiempoTotal = Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60)); // minutos
    
    // Si es menos del tiempo de fracción mínima, cobra la fracción completa
    if (tiempoTotal <= minutosFraccion) {
      return { tiempoTotal, totalPago: precioFraccion };
    }
    
    // Calcular horas completas
    const horasCompletas = Math.floor(tiempoTotal / 60);
    const minutosRestantes = tiempoTotal % 60;
    
    let totalPago = horasCompletas * precioHora;
    
    // Si hay minutos restantes, cobrar fracción
    if (minutosRestantes > 0) {
      const fraccionesAdicionales = Math.ceil(minutosRestantes / minutosFraccion);
      totalPago += fraccionesAdicionales * precioFraccion;
    }
    
    return { tiempoTotal, totalPago };
  }

  // Registrar entrada de vehículo
  async registrarEntrada(req: Request, res: Response): Promise<void> {
    try {
      const { placa, tipo_vehiculo_id, usuario = 'sistema' } = req.body;

      if (!placa || !tipo_vehiculo_id) {
        res.status(400).json({
          success: false,
          message: 'Placa y tipo de vehículo son requeridos'
        });
        return;
      }

      // Validar que no exista vehículo activo con la misma placa
      const vehiculoActivo = await VehiculoParqueadero.findOne({
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

      // Obtener información del tipo de vehículo
      const tipoVehiculo = await TipoVehiculo.findById(tipo_vehiculo_id);
      if (!tipoVehiculo || !tipoVehiculo.activo) {
        res.status(400).json({
          success: false,
          message: 'Tipo de vehículo no válido'
        });
        return;
      }

      // Generar código de barras único
      const codigoBarras = this.generarCodigoBarras('PK');

      // Crear registro de entrada
      const vehiculo = new VehiculoParqueadero({
        placa: placa.toUpperCase(),
        tipo_vehiculo_id,
        codigo_barras: codigoBarras,
        precio_hora: tipoVehiculo.precio_hora,
        precio_fraccion: tipoVehiculo.precio_fraccion,
        minutos_fraccion: tipoVehiculo.minutos_fraccion,
        usuario_entrada: usuario
      });

      await vehiculo.save();

      // Registrar en logs
      const log = new LogSistema({
        usuario,
        accion: 'ENTRADA_VEHICULO',
        modulo: 'PARQUEADERO',
        descripcion: `Placa: ${placa}, Tipo: ${tipoVehiculo.nombre}, Código: ${codigoBarras}`,
        ip: req.ip
      });
      await log.save();

      logger.info('Vehículo registrado en parqueadero', {
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

    } catch (error) {
      logger.error('Error registrando entrada de vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Registrar salida de vehículo
  async registrarSalida(req: Request, res: Response): Promise<void> {
    try {
      const { codigo_barras, placa, usuario = 'sistema' } = req.body;

      if (!codigo_barras && !placa) {
        res.status(400).json({
          success: false,
          message: 'Código de barras o placa son requeridos'
        });
        return;
      }

      // Buscar vehículo activo
      const filtro: any = { estado: 'ACTIVO' };
      if (codigo_barras) {
        filtro.codigo_barras = codigo_barras;
      } else {
        filtro.placa = placa.toUpperCase();
      }

      const vehiculo = await VehiculoParqueadero.findOne(filtro).populate('tipo_vehiculo_id');

      if (!vehiculo) {
        res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado o ya fue procesado'
        });
        return;
      }

      // Calcular tiempo y tarifa
      const fechaSalida = new Date();
      const { tiempoTotal, totalPago } = this.calcularTarifa(
        vehiculo.fecha_entrada,
        fechaSalida,
        vehiculo.precio_hora,
        vehiculo.precio_fraccion,
        vehiculo.minutos_fraccion
      );

      // Actualizar registro
      vehiculo.fecha_salida = fechaSalida;
      vehiculo.tiempo_total = tiempoTotal;
      vehiculo.total_pago = totalPago;
      vehiculo.estado = 'PAGADO';
      vehiculo.usuario_salida = usuario;

      await vehiculo.save();

      // Registrar en logs
      const log = new LogSistema({
        usuario,
        accion: 'SALIDA_VEHICULO',
        modulo: 'PARQUEADERO',
        descripcion: `Placa: ${vehiculo.placa}, Tiempo: ${tiempoTotal} min, Total: $${totalPago}`,
        datos_adicionales: { tiempo_total: tiempoTotal, total_pago: totalPago },
        ip: req.ip
      });
      await log.save();

      logger.info('Vehículo procesado salida', {
        placa: vehiculo.placa,
        tiempo_total: tiempoTotal,
        total_pago: totalPago
      });

      res.json({
        success: true,
        data: {
          id: vehiculo._id,
          placa: vehiculo.placa,
          tipo_vehiculo: (vehiculo.tipo_vehiculo_id as any).nombre,
          fecha_entrada: vehiculo.fecha_entrada,
          fecha_salida: vehiculo.fecha_salida,
          tiempo_total: tiempoTotal,
          total_pago: totalPago,
          codigo_barras: vehiculo.codigo_barras
        },
        message: 'Salida procesada exitosamente'
      });

    } catch (error) {
      logger.error('Error procesando salida de vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener vehículos activos
  async obtenerVehiculosActivos(req: Request, res: Response): Promise<void> {
    try {
      const vehiculos = await VehiculoParqueadero.find({ estado: 'ACTIVO' })
        .populate('tipo_vehiculo_id')
        .sort({ fecha_entrada: -1 });

      const vehiculosFormateados = vehiculos.map(vehiculo => ({
        id: vehiculo._id,
        placa: vehiculo.placa,
        tipo_vehiculo: (vehiculo.tipo_vehiculo_id as any).nombre,
        fecha_entrada: vehiculo.fecha_entrada,
        codigo_barras: vehiculo.codigo_barras,
        tiempo_transcurrido: Math.ceil((Date.now() - vehiculo.fecha_entrada.getTime()) / (1000 * 60))
      }));

      res.json({
        success: true,
        data: vehiculosFormateados,
        total: vehiculosFormateados.length
      });

    } catch (error) {
      logger.error('Error obteniendo vehículos activos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas del día
  async obtenerEstadisticasDia(req: Request, res: Response): Promise<void> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(hoy.getDate() + 1);

      // Vehículos del día
      const vehiculosHoy = await VehiculoParqueadero.find({
        fecha_entrada: { $gte: hoy, $lt: manana }
      });

      // Vehículos activos
      const vehiculosActivos = await VehiculoParqueadero.countDocuments({ estado: 'ACTIVO' });

      // Ingresos del día
      const ingresosHoy = vehiculosHoy
        .filter(v => v.total_pago)
        .reduce((total, v) => total + (v.total_pago || 0), 0);

      // Vehículos procesados (con salida)
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

    } catch (error) {
      logger.error('Error obteniendo estadísticas del día:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar vehículo por código de barras o placa
  async buscarVehiculo(req: Request, res: Response): Promise<void> {
    try {
      const { codigo_barras, placa } = req.query;

      if (!codigo_barras && !placa) {
        res.status(400).json({
          success: false,
          message: 'Código de barras o placa son requeridos'
        });
        return;
      }

      const filtro: any = {};
      if (codigo_barras) {
        filtro.codigo_barras = codigo_barras;
      } else {
        filtro.placa = (placa as string).toUpperCase();
      }

      const vehiculo = await VehiculoParqueadero.findOne(filtro)
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
          tipo_vehiculo: (vehiculo.tipo_vehiculo_id as any).nombre,
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

    } catch (error) {
      logger.error('Error buscando vehículo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}