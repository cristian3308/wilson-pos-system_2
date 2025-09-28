'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users, 
  Activity,
  BarChart3,
  RefreshCw,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Building,
  Droplets
} from 'lucide-react';
import CompanyLogo from './ui/CompanyLogo';
import DatabaseStatus from './DatabaseStatus';
import DateRangeFilter, { DateRange } from './DateRangeFilter';
import { useHistoryData } from '../hooks/useHistoryData';
import { useHydration } from '@/hooks/useHydration';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, subtitle, icon: Icon, gradient, trend }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <Icon className="w-8 h-8" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
          }`}>
            <TrendingUp className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-3xl font-bold">{value}</h3>
        <p className="text-lg font-medium opacity-90">{title}</p>
        {subtitle && (
          <p className="text-sm opacity-70">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  onClick?: () => void;
}

function QuickAction({ title, description, icon: Icon, color, onClick }: QuickActionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-left w-full`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}

export default function ImprovedDashboard() {
  const isHydrated = useHydration();
  const [currentTime, setCurrentTime] = useState('');

  // Hook para datos del historial con filtros
  const {
    parkingRecords,
    carwashRecords,
    dailySummary,
    loading: historyLoading,
    loadData,
    currentDateRange
  } = useHistoryData();

  // Estado para mostrar/ocultar filtros
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isHydrated) {
      const updateTime = () => {
        setCurrentTime(new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      };
      
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isHydrated]);

  const currentDate = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Header Section - Compacto */}
      <div className="mb-4">
        <div className="bg-white rounded-xl p-3 shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CompanyLogo size="sm" showText={true} className="text-gray-800" />
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">PARQUEADERO WILSON</h1>
                <p className="text-gray-600 text-xs">NIT 19475534</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <span className="text-xs font-medium">Bienvenido Wilson González</span>
              </div>
              <div className="text-sm font-mono font-bold text-gray-800">{currentTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Filtros */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Filtros de Dashboard</span>
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="p-4">
              <DateRangeFilter 
                onFilterChange={loadData}
                className="border-0 p-0 bg-transparent"
              />
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Período actual:</strong> {currentDateRange ? (
                    `${currentDateRange.startDate.toLocaleDateString('es-CO')} - ${currentDateRange.endDate.toLocaleDateString('es-CO')}`
                  ) : 'Hoy'}
                  {historyLoading && (
                    <span className="ml-2 inline-flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span className="ml-1">Cargando...</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards - Ahora con datos reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Ingresos del Período"
          value={`$${dailySummary.totalRevenue.toLocaleString()}`}
          subtitle={`Parqueadero: $${dailySummary.parkingRevenue.toLocaleString()} | Lavadero: $${dailySummary.carwashRevenue.toLocaleString()}`}
          icon={DollarSign}
          gradient="from-green-500 to-green-700"
          trend={{ value: 12, isPositive: true }}
        />
        
        <MetricCard
          title="Vehículos Atendidos"
          value={dailySummary.totalTransactions.toString()}
          subtitle={`Parking: ${dailySummary.parkingTransactions} | Lavado: ${dailySummary.carwashTransactions}`}
          icon={Car}
          gradient="from-blue-500 to-blue-700"
        />
        
        <MetricCard
          title="Vehículos Activos"
          value={parkingRecords.filter(record => record.status === 'active').length.toString()}
          subtitle="En parqueadero ahora"
          icon={Building}
          gradient="from-purple-500 to-purple-700"
        />
        
        <MetricCard
          title="Servicios en Progreso"
          value={carwashRecords.filter(record => record.status === 'in_progress').length.toString()}
          subtitle="Lavados activos"
          icon={Droplets}
          gradient="from-cyan-500 to-cyan-700"
        />
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* Vehicle Distribution */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribución de Vehículos
            </h3>
            <button className="text-blue-600 hover:text-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">Carros</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-500">0%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Motos</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-500">0%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wash Services */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              Servicios de Lavadero
            </h3>
            <button className="text-blue-600 hover:text-blue-700 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="font-medium text-gray-700">Básico</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-500">0%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="font-medium text-gray-700">Completo</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">0</div>
                <div className="text-xs text-gray-500">0%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="mb-4">
        <DatabaseStatus />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <QuickAction
            title="Nuevo Ticket"
            description="Registrar ingreso de vehículo"
            icon={Car}
            color="bg-blue-600"
          />
          
          <QuickAction
            title="Servicio de Lavado"
            description="Crear orden de lavado"
            icon={Droplets}
            color="bg-purple-600"
          />
          
          <QuickAction
            title="Cierre de Caja"
            description="Procesar cierre diario"
            icon={DollarSign}
            color="bg-green-600"
          />
          
          <QuickAction
            title="Reportes"
            description="Ver informes y estadísticas"
            icon={BarChart3}
            color="bg-orange-600"
          />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Sistema Operativo</span>
            </div>
            <div className="text-gray-600">
              Última actualización: Hace un momento
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-gray-500">
            <span>FPS: N/A</span>
            <span>CPU: 0%</span>
            <span>LAT: N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
}