'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Bike, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users, 
  Activity,
  Zap,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Loader2,
  Truck,
  Droplets
} from 'lucide-react';
import { useSystem } from '@/contexts/SystemContext';
import { DashboardMetrics, safeGetVehicleStats, safeGetCarwashStats, formatCurrency } from '@/types';

export default function AdvancedDashboard() {
  const { state, actions } = useSystem();
  const { metrics, loadingStates, isOnline, lastUpdate, errors } = state;

  const isLoading = loadingStates.dashboard === 'loading' || loadingStates.global === 'loading';
  const hasError = !!errors.dashboard;

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Nunca';
    const now = new Date();
    const updated = new Date(lastUpdate);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    return updated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  // Loading state
  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-xl font-semibold text-white mb-2">Cargando Dashboard</h3>
          <p className="text-blue-200">Obteniendo datos del sistema...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (hasError && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-800/30 backdrop-blur-sm border border-red-600/50 rounded-2xl p-8 text-center max-w-md"
        >
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Error de Conexión</h3>
          <p className="text-red-200 mb-6">{errors.dashboard}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={actions.loadDashboardMetrics}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <button
              onClick={() => actions.clearError('dashboard')}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Default metrics if none available
  const safeMetrics: DashboardMetrics = metrics || {
    ingresosTotales: 0,
    ingresosParqueadero: 0,
    ingresosLavadero: 0,
    vehiculosActivos: 0,
    ordenesLavadero: 0,
    vehiculosPorTipo: { carro: 0, moto: 0, bicicleta: 0 },
    serviciosLavadero: { basico: 0, completo: 0, premium: 0 },
    ocupacionPorcentaje: 0
  };

  const vehiculosPorTipo = safeGetVehicleStats(safeMetrics.vehiculosPorTipo);
  const serviciosLavadero = safeGetCarwashStats(safeMetrics.serviciosLavadero);
  
  const totalVehiculos = vehiculosPorTipo.carro + vehiculosPorTipo.moto + vehiculosPorTipo.bicicleta;
  const totalServicios = serviciosLavadero.basico + serviciosLavadero.completo + serviciosLavadero.premium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      {/* Header con estado del sistema */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Sistema POS Profesional
            </h1>
            <p className="text-blue-200 text-lg">
              Parqueadero y Lavadero - Dashboard Ejecutivo
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Estado de conexión */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">En Línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Sin Conexión</span>
                </>
              )}
            </div>
            
            {/* Última actualización */}
            <div className="flex items-center gap-2 text-blue-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Actualizado: {formatLastUpdate()}</span>
            </div>
            
            {/* Botón de actualización */}
            <button
              onClick={actions.refreshAll}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Actualizar
            </button>
          </div>
        </div>

        {/* Notificaciones de error */}
        <AnimatePresence>
          {Object.entries(errors).map(([key, error]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-600/20 border border-red-500/50 rounded-lg p-4 mb-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-200">{error}</span>
              </div>
              <button
                onClick={() => actions.clearError(key)}
                className="text-red-400 hover:text-red-300"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Métricas principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Ingresos Totales */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-2xl p-6 text-white shadow-2xl border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <DollarSign className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-1 text-green-200">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">
            {formatCurrency(safeMetrics.ingresosTotales)}
          </h3>
          <p className="text-green-200 text-sm">Ingresos del Día</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-200">Parqueadero:</span>
              <span className="font-medium">{formatCurrency(safeMetrics.ingresosParqueadero)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-200">Lavadero:</span>
              <span className="font-medium">{formatCurrency(safeMetrics.ingresosLavadero)}</span>
            </div>
          </div>
        </motion.div>

        {/* Vehículos Activos */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white shadow-2xl border border-blue-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Car className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-1 text-blue-200">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Activo</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">{safeMetrics.vehiculosActivos}</h3>
          <p className="text-blue-200 text-sm">Vehículos en Parqueadero</p>
          
          <div className="mt-4">
            <div className="bg-white/10 rounded-full h-2 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${safeMetrics.ocupacionPorcentaje}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-white h-2 rounded-full"
              />
            </div>
            <div className="flex justify-between text-sm text-blue-200">
              <span>Ocupación</span>
              <span className="font-medium">{safeMetrics.ocupacionPorcentaje}%</span>
            </div>
          </div>
        </motion.div>

        {/* Gestión de Lavadero */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-6 text-white shadow-2xl border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Droplets className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-1 text-purple-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Activo</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1">{safeMetrics.ordenesLavadero}</h3>
          <p className="text-purple-200 text-sm">Servicios en Proceso</p>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 rounded-lg p-2">
              <span className="text-xs block">Básico</span>
              <span className="text-sm font-medium">{serviciosLavadero.basico}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <span className="text-xs block">Completo</span>
              <span className="text-sm font-medium">{serviciosLavadero.completo}</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2">
              <span className="text-xs block">Premium</span>
              <span className="text-sm font-medium">{serviciosLavadero.premium}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts y visualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribución de Vehículos */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            Distribución de Vehículos
          </h3>
          
          <div className="space-y-4">
            {[
              { type: 'Carros', count: vehiculosPorTipo.carro, icon: Car, color: 'bg-blue-500' },
              { type: 'Motos', count: vehiculosPorTipo.moto, icon: Truck, color: 'bg-green-500' },
              { type: 'Bicicletas', count: vehiculosPorTipo.bicicleta, icon: Bike, color: 'bg-yellow-500' }
            ].map((item, index) => {
              const percentage = calculatePercentage(item.count, totalVehiculos);
              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <item.icon className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">{item.type}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                  
                  <div className="text-right min-w-[80px]">
                    <span className="text-white font-bold text-lg">{item.count}</span>
                    <div className="text-blue-200 text-sm">{percentage}%</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Servicios de Lavadero */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6" />
            Servicios de Lavadero
          </h3>
          
          <div className="space-y-4">
            {[
              { type: 'Básico', count: serviciosLavadero.basico, color: 'bg-orange-500' },
              { type: 'Completo', count: serviciosLavadero.completo, color: 'bg-purple-500' },
              { type: 'Premium', count: serviciosLavadero.premium, color: 'bg-pink-500' }
            ].map((item, index) => {
              const percentage = calculatePercentage(item.count, totalServicios);
              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className={`w-4 h-4 rounded-full ${item.color}`} />
                    <span className="text-white font-medium">{item.type}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                  
                  <div className="text-right min-w-[80px]">
                    <span className="text-white font-bold text-lg">{item.count}</span>
                    <div className="text-blue-200 text-sm">{percentage}%</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}