'use client';

import { useState } from 'react';
import { SystemProvider } from '@/contexts/SystemContext';
import RealDashboard from '@/components/RealDashboard';
import ImprovedParqueaderoManagement from '@/components/ImprovedParqueaderoManagement';
import CarwashManagement from '@/components/CarwashManagement';
import LavaderoManagement from '@/components/LavaderoManagement';
import WorkersManagement from '@/components/WorkersManagement';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import ParkingManagement from '@/components/ParkingManagement';
import BusinessConfigurationPanel from '@/components/BusinessConfigurationPanel';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  Droplets, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Users,
  CreditCard,
  Clock
} from 'lucide-react';
import { useHydration } from '@/hooks/useHydration';
import { useIsDesktop } from '@/hooks/useWindowSize';

type ViewMode = 'dashboard' | 'parqueadero' | 'mensual' | 'lavadero' | 'trabajadores' | 'configuracion' | 'parking' | 'carwash' | 'workers' | 'configuration' | 'business-config';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isHydrated = useHydration();
  const isDesktop = useIsDesktop();

  const navigationItems = [
    {
      id: 'dashboard' as ViewMode,
      title: 'Dashboard Inteligente',
      description: 'Panel de control principal con métricas en tiempo real',
      icon: '📊',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'parqueadero' as ViewMode,
      title: 'Gestión Parqueadero',
      description: 'Control de vehículos por horas',
      icon: '🚗',
      gradient: 'from-green-500 to-teal-600'
    },
    {
      id: 'mensual' as ViewMode,
      title: 'Planes Mensuales',
      description: 'Administración de mensualidades',
      icon: '📅',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      id: 'lavadero' as ViewMode,
      title: 'Cierre de Caja Lavadero',
      description: 'Gestión completa del servicio de lavado',
      icon: '🧽',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'trabajadores' as ViewMode,
      title: 'Gestión Personal',
      description: 'Administración de trabajadores',
      icon: '👥',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      id: 'configuracion' as ViewMode,
      title: 'Configuración Empresarial',
      description: 'Parámetros del sistema empresarial',
      icon: '⚙️',
      gradient: 'from-gray-600 to-gray-800'
    }
  ];  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <RealDashboard />;
      case 'parqueadero':
        return <ImprovedParqueaderoManagement />;
      case 'mensual':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 p-4">
            {/* Header Section */}
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
                    <div className="text-sm font-mono font-bold text-gray-800">
                      {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center min-h-96">
              <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg w-full text-center">
                <Clock className="w-16 h-16 text-teal-600 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Clientes Mensuales</h1>
                <p className="text-gray-600 mb-8 text-lg">
                  Gestión de clientes con suscripciones mensuales y semanales. 
                  Próximamente disponible.
                </p>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-medium transition-colors"
                >
                  Volver al Dashboard
                </button>
              </div>
            </div>
          </div>
        );
      case 'lavadero':
        return <CarwashManagement />;
      case 'trabajadores':
        return <WorkersManagement />;
      case 'configuracion':
        return <BusinessConfigurationPanel />;
      default:
        return <RealDashboard />;
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-slate-300">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <SystemProvider>
      <div className="min-h-screen bg-gray-900 flex">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || (isHydrated && isDesktop)) && (
            <motion.aside
              key="sidebar"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed lg:relative inset-y-0 left-0 z-50 w-60 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 lg:translate-x-0"
            >
              <div className="flex flex-col h-full">
                {/* Header del Sidebar - Compacto */}
                <div className="p-3 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <CompanyLogo size="sm" showText={true} />
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="lg:hidden text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1">
                  {navigationItems.map((item) => (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as ViewMode);
                        setSidebarOpen(false);
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                        currentView === item.id
                          ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <div className="font-medium text-xs">{item.title}</div>
                          <div className="text-xs opacity-80">{item.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </nav>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700/50">
                  <div className="text-center text-slate-400 text-sm">
                    <p>© 2024 POS Professional</p>
                    <p className="text-green-400 font-medium">Versión 2.0 Enterprise</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile header */}
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">POS Professional</h1>
                <p className="text-slate-400 text-sm">
                  {navigationItems.find(item => item.id === currentView)?.title}
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <main className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderCurrentView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Overlay for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}
        </AnimatePresence>
      </div>
    </SystemProvider>
  );
}
