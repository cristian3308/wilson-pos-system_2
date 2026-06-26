import { Request, Response } from 'express';
import { dbService } from '../services/DatabaseService';
import logger from '../utils/logger';

export class ConfiguracionController {

  async obtenerTiposVehiculos(req: Request, res: Response): Promise<void> {
    try {
      const tipos = await dbService.query(
        'SELECT id, nombre, tarifa_hora, tarifa_dia FROM tipos_vehiculos WHERE activo = 1 ORDER BY nombre ASC'
      );

      res.json({
        success: true,
        data: tipos.map((t: any) => ({
          id: t.id.toString(),
          nombre: t.nombre,
          precio_hora: t.tarifa_hora,
          precio_dia: t.tarifa_dia
        }))
      });
    } catch (error) {
      logger.error('Error obteniendo tipos de vehículos:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async obtenerConfiguracion(req: Request, res: Response): Promise<void> {
    try {
      const configs = await dbService.query('SELECT clave, valor FROM configuracion_sistema');
      const config: any = {};
      for (const c of configs) {
        config[c.clave] = c.valor;
      }
      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error obteniendo configuración:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async actualizarConfiguracion(req: Request, res: Response): Promise<void> {
    try {
      const { configuraciones } = req.body;
      if (!configuraciones || typeof configuraciones !== 'object') {
        res.status(400).json({ success: false, message: 'Configuraciones no válidas' });
        return;
      }

      for (const [clave, valor] of Object.entries(configuraciones)) {
        await dbService.run(
          'INSERT INTO configuracion_sistema (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = ?',
          [clave, valor as string, valor as string]
        );
      }

      logger.info('Configuración actualizada', { configuraciones });
      res.json({ success: true, message: 'Configuración actualizada correctamente' });
    } catch (error) {
      logger.error('Error actualizando configuración:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async obtenerEstadisticasCompletas(req: Request, res: Response): Promise<void> {
    try {
      const vehiculosActivos = await dbService.query(
        "SELECT COUNT(*) as total FROM vehiculos_parqueadero WHERE estado = 'ACTIVO'"
      );

      const hoy = new Date().toISOString().split('T')[0];

      const vehiculosHoy = await dbService.query(
        'SELECT COUNT(*) as total, COALESCE(SUM(total_pagar), 0) as ingresos FROM vehiculos_parqueadero WHERE DATE(fecha_entrada) = ?',
        [hoy]
      );

      const ordenesActivas = await dbService.query(
        "SELECT COUNT(*) as total FROM ordenes_lavadero WHERE estado IN ('PENDIENTE', 'EN_PROCESO')"
      );

      const ordenesHoy = await dbService.query(
        "SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as ingresos FROM ordenes_lavadero WHERE DATE(fecha_creacion) = ? AND estado IN ('TERMINADO', 'CANCELADO')",
        [hoy]
      );

      res.json({
        success: true,
        data: {
          parqueadero: {
            vehiculos_activos: vehiculosActivos[0]?.total || 0,
            vehiculos_hoy: vehiculosHoy[0]?.total || 0,
            ingresos_hoy: vehiculosHoy[0]?.ingresos || 0
          },
          lavadero: {
            ordenes_activas: ordenesActivas[0]?.total || 0,
            ordenes_hoy: ordenesHoy[0]?.total || 0,
            ingresos_hoy: ordenesHoy[0]?.ingresos || 0
          }
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  async obtenerResumenDiario(req: Request, res: Response): Promise<void> {
    try {
      const hoy = new Date().toISOString().split('T')[0];

      const ingresosParking = await dbService.query(
        "SELECT COALESCE(SUM(total_pagar), 0) as total FROM vehiculos_parqueadero WHERE DATE(fecha_salida) = ? AND estado = 'FINALIZADO'",
        [hoy]
      );

      const ingresosLavadero = await dbService.query(
        "SELECT COALESCE(SUM(total), 0) as total FROM ordenes_lavadero WHERE DATE(fecha_finalizacion) = ? AND estado = 'TERMINADO'",
        [hoy]
      );

      const vehiculosPorTipo = await dbService.query(`
        SELECT tv.nombre, COUNT(v.id) as cantidad
        FROM tipos_vehiculos tv
        LEFT JOIN vehiculos_parqueadero v ON tv.id = v.tipo_vehiculo_id AND DATE(v.fecha_entrada) = ?
        GROUP BY tv.id, tv.nombre
      `, [hoy]);

      res.json({
        success: true,
        data: {
          fecha: hoy,
          ingresosParqueadero: ingresosParking[0]?.total || 0,
          ingresosLavadero: ingresosLavadero[0]?.total || 0,
          ingresosTotales: (ingresosParking[0]?.total || 0) + (ingresosLavadero[0]?.total || 0),
          vehiculosPorTipo
        }
      });
    } catch (error) {
      logger.error('Error obteniendo resumen diario:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
}
