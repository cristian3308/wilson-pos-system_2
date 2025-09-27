'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon,
  TruckIcon,
  SparklesIcon,
  QrCodeIcon,
  ChartBarIcon,
  PlayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

import { useDashboardDataReal } from '@/hooks/useDashboardDataReal';
import ParqueaderoManagement from '@/components/ImprovedParqueaderoManagement';
import CarwashManagement from '@/components/CarwashManagement';
import DatabaseAdmin from '@/components/DatabaseAdmin';
import ConnectionIndicator from '@/components/ConnectionIndicator';
import SyncButton from '@/components/SyncButton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function RealDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'parking' | 'carwash' | 'admin'>('overview');
  const { data, isLoading, error, refreshData } = useDashboardDataReal();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error al cargar el dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const renderOverview = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Ingresos del Día</p>
              <p className="text-3xl font-bold">$ {data.metrics.totalRevenue?.toLocaleString() || 'NaN'}</p>
              <p className="text-green-200 text-xs mt-1">
                Parqueadero: $ {data.metrics.parkingRevenue?.toLocaleString() || 'NaN'} | Lavadero: $ {data.metrics.carwashRevenue?.toLocaleString() || 'NaN'}
              </p>
            </div>
            <CurrencyDollarIcon className="w-12 h-12 text-green-200" />
          </div>
          <div className="mt-2 flex items-center text-green-200">
            <span className="text-xs">↗ 12%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Vehículos en Parqueadero</p>
              <p className="text-3xl font-bold">{data.metrics.activeSpots || 0}</p>
              <p className="text-blue-200 text-xs mt-1">
                Ocupación: {data.metrics.activeSpots > 0 ? Math.round((data.metrics.activeSpots / 50) * 100) : 0}%
              </p>
            </div>
            <TruckIcon className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Órdenes de Lavado</p>
              <p className="text-3xl font-bold">{data.metrics.completedServices || 0}</p>
              <p className="text-orange-200 text-xs mt-1">
                Básico: {data.carwashServices.find(s => s.name === 'Básico')?.value || 0} | 
                Completo: {data.carwashServices.find(s => s.name === 'Completo')?.value || 0} | 
                Premium: {data.carwashServices.find(s => s.name === 'Premium')?.value || 0}
              </p>
            </div>
            <SparklesIcon className="w-12 h-12 text-orange-200" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">En Línea</p>
              <p className="text-sm text-purple-200 mb-1">Conectado a la nube. Los datos se sincronizan automáticamente.</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-purple-200">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-xs text-purple-200">Firebase</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Distribución de Vehículos y Servicios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Distribución de Vehículos</h3>
            <button onClick={refreshData} className="text-blue-600 hover:text-blue-700">
              <ChartBarIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {data.vehicleDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{item.value}</span>
                  <span className="text-gray-500 ml-1 text-sm">
                    {data.metrics.totalVehicles > 0 ? Math.round((item.value / data.metrics.totalVehicles) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Servicios de Lavadero</h3>
            <button onClick={refreshData} className="text-purple-600 hover:text-purple-700">
              <SparklesIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {data.carwashServices.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{item.value}</span>
                  <span className="text-gray-500 ml-1 text-sm">
                    {data.metrics.completedServices > 0 ? Math.round((item.value / data.metrics.completedServices) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Acciones Rápidas */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('parking')}
            className="flex flex-col items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Nuevo Ticket</h4>
            <p className="text-sm text-gray-600 text-center">Registrar ingreso de vehículo</p>
          </button>

          <button
            onClick={() => setActiveTab('carwash')}
            className="flex flex-col items-center p-6 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Servicio de Lavado</h4>
            <p className="text-sm text-gray-600 text-center">Crear orden de lavado</p>
          </button>

          <button className="flex flex-col items-center p-6 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Cierre de Caja</h4>
            <p className="text-sm text-gray-600 text-center">Procesar cierre diario</p>
          </button>

          <button className="flex flex-col items-center p-6 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Reportes</h4>
            <p className="text-sm text-gray-600 text-center">Ver informes y estadísticas</p>
          </button>
        </div>
      </motion.div>

      {/* Actividad Reciente */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' : 
                  activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-600">{activity.time}</p>
                </div>
              </div>
              {activity.amount && (
                <span className="text-sm font-semibold text-green-600">
                  +${activity.amount.toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard POS</h1>
              <div className="ml-4 flex items-center space-x-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('parking')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'parking'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Parqueadero
                </button>
                <button
                  onClick={() => setActiveTab('carwash')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'carwash'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lavadero
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionIndicator />
              <SyncButton 
                onSyncComplete={(success) => {
                  if (success) {
                    refreshData(); // Actualizar dashboard después de sincronización exitosa
                  }
                }}
                size="sm"
                variant="success"
              />
              <button
                onClick={refreshData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'parking' && <ParqueaderoManagement />}
        {activeTab === 'carwash' && <CarwashManagement />}
        {activeTab === 'admin' && <DatabaseAdmin />}
      </div>
    </div>
  );
}