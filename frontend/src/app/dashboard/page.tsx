'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  QrCodeIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LiveMetrics } from '@/components/dashboard/LiveMetrics';
import AppHeader from '@/components/AppHeader';
import ParqueaderoManagement from '@/components/ImprovedParqueaderoManagement';
import CarwashManagement from '@/components/CarwashManagement';
import WorkersManagement from '@/components/WorkersManagement';
import BalanceDashboard from '@/components/BalanceDashboard';
import MonthlySubscriptionManager from '@/components/MonthlySubscriptionManager';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getDualDB } from '@/lib/dualDatabase';

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

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [activeTab, setActiveTab] = useState<'overview' | 'parking' | 'carwash' | 'subscriptions' | 'workers' | 'balance'>('overview');
  const [expiringCount, setExpiringCount] = useState(0);
  const { data, isLoading, error, refreshData } = useDashboardData();
  const { isConnected, data: wsData } = useWebSocket();

  useEffect(() => {
    // Refetch data when receiving WebSocket updates
    if (wsData?.activity) {
      refreshData();
    }
  }, [wsData, refreshData]);

  // Verificar suscripciones próximas a vencer
  useEffect(() => {
    const checkExpiringSubscriptions = async () => {
      try {
        const dualDB = getDualDB();
        const expiring = await dualDB.getExpiringSubscriptions(3); // Próximos 3 días
        
        setExpiringCount(expiring?.length || 0);
        
        if (expiring && expiring.length > 0) {
          expiring.forEach((sub: any) => {
            const endDate = new Date(sub.endDate);
            const today = new Date();
            const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            toast(
              `⚠️ Suscripción de ${sub.clientName} (${sub.vehiclePlate}) vence en ${daysRemaining} día(s)`,
              {
                icon: '📅',
                duration: 6000,
                position: 'top-right',
                style: {
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '2px solid #F59E0B',
                  fontWeight: '500'
                }
              }
            );
          });
        }
      } catch (error) {
        console.error('Error verificando suscripciones:', error);
      }
    };

    // Verificar al cargar la página
    checkExpiringSubscriptions();
    
    // Verificar cada 30 minutos
    const interval = setInterval(checkExpiringSubscriptions, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-danger-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error al cargar el dashboard</h2>
          <p className="text-muted-foreground mb-4">Hubo un problema al obtener los datos.</p>
          <button 
            onClick={() => refreshData()}
            className="btn btn-primary"
          >
            Reintentar
          </button>
        </Card>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalRevenue: 0,
    activeSpots: 0,
    completedServices: 0,
    activeEmployees: 0,
    activeWashes: 0
  };
  const revenueData = data?.revenueData || [];
  const occupancyData = data?.occupancyData || [];
  const recentActivities = data?.recentActivities || [];

  const tabs = [
    { id: 'overview', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'balance', name: '💰 Balances', icon: CurrencyDollarIcon },
    { id: 'parking', name: 'Parqueadero', icon: TruckIcon },
    { id: 'carwash', name: 'Lavadero', icon: SparklesIcon },
    { id: 'subscriptions', name: 'Clientes Mensuales', icon: CalendarIcon },
    { id: 'workers', name: 'Trabajadores', icon: UserGroupIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'admin') {
      window.location.href = '/admin';
    } else {
      setActiveTab(tabId as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/30 to-neutral-50 dark:from-neutral-900 dark:via-blue-900/10 dark:to-neutral-900">
      <div className="container-padding section-padding">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <AppHeader 
              title="Dashboard"
              subtitle="Gestión integral de parqueadero y lavadero"
            />
            
            {/* Time Range Selector (only for overview) */}
            {activeTab === 'overview' && (
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                {(['today', 'week', 'month'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      timeRange === range
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div variants={itemVariants}>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const showBadge = tab.id === 'subscriptions' && expiringCount > 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white animate-pulse">
                          {expiringCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div variants={itemVariants} key={activeTab}>
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Live Metrics */}
                <LiveMetrics />

                {/* Main Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Ingresos Totales"
                    value={`$${metrics.totalRevenue?.toLocaleString() || 0}`}
                    trend={{ value: 12.5, isPositive: true }}
                    icon={<CurrencyDollarIcon className="h-6 w-6" />}
                    color="green"
                  />
                  
                  <MetricCard
                    title="Espacios Activos"
                    value={`${metrics.activeSpots || 0}`}
                    trend={{ value: 8.2, isPositive: true }}
                    icon={<ChartBarIcon className="h-6 w-6" />}
                    color="blue"
                  />
                  
                  <MetricCard
                    title="Servicios Completados"
                    value={metrics.completedServices || 0}
                    trend={{ value: 15.3, isPositive: true }}
                    icon={<TruckIcon className="h-6 w-6" />}
                    color="yellow"
                  />
                  
                  <MetricCard
                    title="Empleados Activos"
                    value={metrics.activeEmployees || 0}
                    trend={{ value: 5.7, isPositive: true }}
                    icon={<CheckCircleIcon className="h-6 w-6" />}
                    color="green"
                  />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Ingresos por Hora</h3>
                      <ArrowTrendingUpIcon className="h-5 w-5 text-success-500" />
                    </div>
                    <RevenueChart data={revenueData} />
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Ocupación del Parqueadero</h3>
                      <ChartBarIcon className="h-5 w-5 text-primary-500" />
                    </div>
                    <OccupancyChart data={occupancyData} />
                  </Card>
                </div>

                {/* Quick Actions & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <Card className="p-6 h-full">
                      <div className="flex items-center gap-2 mb-6">
                        <SparklesIcon className="h-5 w-5 text-primary-500" />
                        <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
                      </div>
                      <QuickActions />
                    </Card>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <Card className="p-6 h-full">
                      <div className="flex items-center gap-2 mb-6">
                        <ClockIcon className="h-5 w-5 text-warning-500" />
                        <h3 className="text-lg font-semibold">Actividad Reciente</h3>
                      </div>
                      <RecentActivity activities={recentActivities} />
                    </Card>
                  </div>
                </div>

                {/* Service Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Parqueadero
                        </p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {metrics.activeSpots || 0}/50
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Espacios ocupados
                        </p>
                      </div>
                      <QrCodeIcon className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Lavadero
                        </p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {metrics.activeWashes || 0}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Servicios activos
                        </p>
                      </div>
                      <SparklesIcon className="h-8 w-8 text-green-500" />
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          Trabajadores
                        </p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {metrics.activeEmployees || 0}
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Activos hoy
                        </p>
                      </div>
                      <UserGroupIcon className="h-8 w-8 text-purple-500" />
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'balance' && <BalanceDashboard />}
            {activeTab === 'parking' && <ParqueaderoManagement />}
            {activeTab === 'carwash' && <CarwashManagement />}
            {activeTab === 'subscriptions' && <MonthlySubscriptionManager />}
            {activeTab === 'workers' && <WorkersManagement />}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}