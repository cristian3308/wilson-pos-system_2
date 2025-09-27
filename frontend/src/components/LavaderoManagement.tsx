'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  Car,
  Sparkles,
  Zap,
  Crown,
  RefreshCw,
  Calendar,
  User,
  Phone,
  Edit3,
  Trash2,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { useSystem } from '@/contexts/SystemContext';
import { CarwashOrder, CarwashService, formatCurrency, formatTime } from '@/types';
import CompanyLogo from '@/components/ui/CompanyLogo';

type CarwashMode = 'crear' | 'gestionar' | 'historial';

const mockServices: CarwashService[] = [
  {
    id: '1',
    nombre: 'Lavado Básico',
    precio: 15000,
    duracion: 30,
    descripcion: 'Lavado exterior básico con agua y jabón',
    icono: 'droplets',
    categoria: 'basico',
    disponible: true
  },
  {
    id: '2',
    nombre: 'Lavado Completo',
    precio: 25000,
    duracion: 45,
    descripcion: 'Lavado completo exterior e interior',
    icono: 'sparkles',
    categoria: 'basico',
    disponible: true
  },
  {
    id: '3',
    nombre: 'Lavado Premium',
    precio: 40000,
    duracion: 60,
    descripcion: 'Lavado premium con encerado y aspirado',
    icono: 'crown',
    categoria: 'premium',
    disponible: true
  },
  {
    id: '4',
    nombre: 'Detallado Express',
    precio: 35000,
    duracion: 50,
    descripcion: 'Detallado rápido interior y exterior',
    icono: 'zap',
    categoria: 'premium',
    disponible: true
  },
  {
    id: '5',
    nombre: 'Lavado Ecológico',
    precio: 20000,
    duracion: 35,
    descripcion: 'Lavado con productos biodegradables',
    icono: 'droplets',
    categoria: 'especializado',
    disponible: true
  },
  {
    id: '6',
    nombre: 'Súper Premium',
    precio: 60000,
    duracion: 90,
    descripcion: 'Tratamiento completo con protección UV',
    icono: 'crown',
    categoria: 'premium',
    disponible: true
  }
];

export default function LavaderoManagement() {
  const { state, actions } = useSystem();
  const { carwashOrders, loadingStates, errors } = state;
  
  const [mode, setMode] = useState<CarwashMode>('crear');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'en_proceso' | 'completado'>('all');
  
  // Form state for creating orders
  const [orderForm, setOrderForm] = useState({
    placaVehiculo: '',
    serviciosSeleccionados: [] as string[],
    cliente: {
      nombre: '',
      telefono: '',
      email: ''
    },
    observaciones: '',
    prioridad: 'normal' as 'normal' | 'urgente'
  });

  const isLoading = loadingStates.carwash === 'loading';

  const filteredOrders = carwashOrders.filter(order => {
    const matchesSearch = order.placaVehiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filterStatus === 'all' || order.estado === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const selectedServices = mockServices.filter(service => 
    orderForm.serviciosSeleccionados.includes(service.id)
  );

  const totalPrice = selectedServices.reduce((sum, service) => sum + service.precio, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duracion, 0);

  const handleServiceToggle = (serviceId: string) => {
    setOrderForm(prev => ({
      ...prev,
      serviciosSeleccionados: prev.serviciosSeleccionados.includes(serviceId)
        ? prev.serviciosSeleccionados.filter(id => id !== serviceId)
        : [...prev.serviciosSeleccionados, serviceId]
    }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderForm.serviciosSeleccionados.length === 0) {
      actions.addNotification({
        type: 'warning',
        title: 'Servicios Requeridos',
        message: 'Debe seleccionar al menos un servicio'
      });
      return;
    }

    try {
      const newOrder: Partial<CarwashOrder> = {
        placaVehiculo: orderForm.placaVehiculo,
        servicios: selectedServices,
        estado: 'pendiente',
        cliente: orderForm.cliente.nombre ? orderForm.cliente : undefined,
        observaciones: orderForm.observaciones,
        total: totalPrice,
        tiempoEstimado: totalDuration,
        prioridad: orderForm.prioridad
      };

      // API call would go here
      actions.addNotification({
        type: 'success',
        title: 'Orden Creada',
        message: `Orden para vehículo ${orderForm.placaVehiculo} creada exitosamente`
      });

      // Reset form
      setOrderForm({
        placaVehiculo: '',
        serviciosSeleccionados: [],
        cliente: { nombre: '', telefono: '', email: '' },
        observaciones: '',
        prioridad: 'normal'
      });

      // Refresh orders
      actions.loadCarwashOrders();

    } catch (error) {
      actions.addNotification({
        type: 'error',
        title: 'Error',
        message: 'No se pudo crear la orden de lavado'
      });
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'droplets': return Droplets;
      case 'sparkles': return Sparkles;
      case 'crown': return Crown;
      case 'zap': return Zap;
      default: return Droplets;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-500';
      case 'en_proceso': return 'bg-blue-500';
      case 'completado': return 'bg-green-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return Clock;
      case 'en_proceso': return PlayCircle;
      case 'completado': return CheckCircle;
      case 'cancelado': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
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

      {/* Content Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Centro de Lavado
            </h1>
            <p className="text-gray-600 text-lg">
              Gestión completa de servicios de lavado y detallado
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={actions.loadCarwashOrders}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Actualizar
            </button>
          </div>
        </div>

        {/* Mode Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'crear', label: 'Crear Orden', icon: Plus },
            { id: 'gestionar', label: 'Gestionar Órdenes', icon: Droplets },
            { id: 'historial', label: 'Historial', icon: Calendar }
          ].map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setMode(item.id as CarwashMode)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all ${
                mode === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {mode === 'crear' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Services Selection */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <Sparkles className="w-6 h-6" />
                    Servicios Disponibles
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockServices.map((service) => {
                      const IconComponent = getServiceIcon(service.icono);
                      const isSelected = orderForm.serviciosSeleccionados.includes(service.id);
                      
                      return (
                        <motion.div
                          key={service.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleServiceToggle(service.id)}
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-purple-400 bg-purple-600/20'
                              : 'border-white/20 bg-white/5 hover:border-purple-400/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-purple-600' : 'bg-purple-600/20'
                            }`}>
                              <IconComponent className="w-5 h-5 text-purple-200" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white">{service.nombre}</h3>
                              <p className="text-purple-200 text-sm">{service.categoria}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                          
                          <p className="text-purple-200 text-sm mb-3">{service.descripcion}</p>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300 font-bold">
                              {formatCurrency(service.precio)}
                            </span>
                            <span className="text-purple-300 text-sm">
                              {service.duracion} min
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Form */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-bold text-white mb-6">Crear Orden</h2>
                  
                  <form onSubmit={handleCreateOrder} className="space-y-4">
                    {/* Vehicle Plate */}
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Placa del Vehículo *
                      </label>
                      <input
                        type="text"
                        value={orderForm.placaVehiculo}
                        onChange={(e) => setOrderForm({ ...orderForm, placaVehiculo: e.target.value.toUpperCase() })}
                        placeholder="ABC123"
                        className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                        required
                      />
                    </div>

                    {/* Client Info */}
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Nombre del Cliente
                      </label>
                      <input
                        type="text"
                        value={orderForm.cliente.nombre}
                        onChange={(e) => setOrderForm({ 
                          ...orderForm, 
                          cliente: { ...orderForm.cliente, nombre: e.target.value }
                        })}
                        placeholder="Nombre completo"
                        className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={orderForm.cliente.telefono}
                        onChange={(e) => setOrderForm({ 
                          ...orderForm, 
                          cliente: { ...orderForm.cliente, telefono: e.target.value }
                        })}
                        placeholder="3001234567"
                        className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Prioridad
                      </label>
                      <select
                        value={orderForm.prioridad}
                        onChange={(e) => setOrderForm({ ...orderForm, prioridad: e.target.value as any })}
                        className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      >
                        <option value="normal">Normal</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    {/* Observations */}
                    <div>
                      <label className="block text-purple-200 font-medium mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={orderForm.observaciones}
                        onChange={(e) => setOrderForm({ ...orderForm, observaciones: e.target.value })}
                        placeholder="Observaciones especiales..."
                        rows={3}
                        className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      />
                    </div>

                    {/* Order Summary */}
                    {selectedServices.length > 0 && (
                      <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                        <h3 className="font-bold text-white mb-3">Resumen de la Orden</h3>
                        
                        <div className="space-y-2">
                          {selectedServices.map((service) => (
                            <div key={service.id} className="flex justify-between text-sm">
                              <span className="text-purple-200">{service.nombre}</span>
                              <span className="text-white">{formatCurrency(service.precio)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-purple-500/30 mt-3 pt-3">
                          <div className="flex justify-between">
                            <span className="text-purple-200">Total:</span>
                            <span className="text-purple-300 font-bold text-lg">
                              {formatCurrency(totalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-200">Tiempo estimado:</span>
                            <span className="text-purple-300">{totalDuration} minutos</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || orderForm.serviciosSeleccionados.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                      Crear Orden de Lavado
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {mode === 'gestionar' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por placa, orden o cliente..."
                        className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                      />
                      <Search className="absolute right-3 top-3 w-5 h-5 text-purple-400" />
                    </div>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
                    >
                      <option value="all">Todas las Órdenes</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completadas</option>
                    </select>
                  </div>
                  
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                </div>
              </div>

              {/* Orders List */}
              <div className="text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Droplets className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No hay órdenes pendientes</h3>
                  <p className="text-purple-200">Crea una nueva orden de lavado para comenzar</p>
                </motion.div>
              </div>
            </div>
          )}

          {mode === 'historial' && (
            <div className="text-center py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Calendar className="w-24 h-24 text-purple-400 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">Historial de Órdenes</h2>
                <p className="text-purple-200 text-lg mb-8 max-w-md mx-auto">
                  Módulo de historial completo en desarrollo.
                  Próximamente disponible con filtros avanzados y reportes detallados.
                </p>
                <button
                  onClick={() => setMode('gestionar')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-colors"
                >
                  Ir a Gestión de Órdenes
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}