'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  User,
  Phone,
  Car,
  DollarSign,
  Plus,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Printer,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { getDualDB, MonthlySubscription } from '@/lib/dualDatabase';
import CompanyLogo from '@/components/ui/CompanyLogo';
import { useHydration } from '@/hooks/useHydration';
import toast from 'react-hot-toast';

const MonthlySubscriptionManager: React.FC = () => {
  const isHydrated = useHydration();
  const [subscriptions, setSubscriptions] = useState<MonthlySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('active');
  const [currentTime, setCurrentTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Formulario de nueva suscripción
  const [newSubscription, setNewSubscription] = useState({
    vehiclePlate: '',
    vehicleType: 'car',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    subscriptionType: 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom',
    customDays: 30,
    amount: 0,
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer',
    notes: ''
  });

  useEffect(() => {
    loadSubscriptions();
    // Verificar suscripciones vencidas cada 5 minutos
    const interval = setInterval(checkExpiredSubscriptions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar hora cada segundo
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const dualDB = getDualDB();
      const allSubs = await dualDB.getAllMonthlySubscriptions();
      
      // Ordenar por fecha de vencimiento (más próximas primero)
      const sorted = allSubs.sort((a, b) => 
        new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      );
      
      setSubscriptions(sorted);
    } catch (error) {
      console.error('Error cargando suscripciones:', error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredSubscriptions = async () => {
    try {
      const dualDB = getDualDB();
      const deactivated = await dualDB.checkAndDeactivateExpiredSubscriptions();
      if (deactivated > 0) {
        await loadSubscriptions();
        toast(`${deactivated} suscripción(es) vencida(s) desactivada(s)`, {
          icon: '⏰',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error verificando suscripciones vencidas:', error);
    }
  };

  const calculateEndDate = () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    switch (newSubscription.subscriptionType) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'biweekly':
        endDate.setDate(endDate.getDate() + 15);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'custom':
        endDate.setDate(endDate.getDate() + newSubscription.customDays);
        break;
    }
    
    return endDate;
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubscription.vehiclePlate.trim() || !newSubscription.clientName.trim()) {
      toast.error('Placa y nombre del cliente son requeridos');
      return;
    }

    if (newSubscription.amount <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    try {
      const dualDB = getDualDB();
      
      // Verificar si ya existe una suscripción activa para esta placa
      const existing = await dualDB.getSubscriptionByPlate(newSubscription.vehiclePlate.toUpperCase());
      if (existing && existing.isActive) {
        toast.error(`Ya existe una suscripción activa para la placa ${newSubscription.vehiclePlate}`);
        return;
      }

      const startDate = new Date();
      const endDate = calculateEndDate();
      
      const subscriptionData: MonthlySubscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vehiclePlate: newSubscription.vehiclePlate.toUpperCase(),
        vehicleType: newSubscription.vehicleType,
        clientName: newSubscription.clientName,
        clientPhone: newSubscription.clientPhone,
        clientEmail: newSubscription.clientEmail || undefined,
        subscriptionType: newSubscription.subscriptionType,
        customDays: newSubscription.subscriptionType === 'custom' ? newSubscription.customDays : undefined,
        startDate,
        endDate,
        amount: newSubscription.amount,
        isPaid: true,
        isActive: true,
        paymentMethod: newSubscription.paymentMethod,
        notes: newSubscription.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dualDB.saveMonthlySubscription(subscriptionData);
      
      toast.success('Suscripción creada exitosamente');
      
      // Imprimir el ticket de suscripción
      try {
        const { printMonthlySubscriptionInvoice } = await import('./PrintFallback');
        await printMonthlySubscriptionInvoice(subscriptionData);
      } catch (printError) {
        console.error('Error imprimiendo factura:', printError);
        toast.error('Suscripción creada pero error al imprimir');
      }
      
      await loadSubscriptions();
      setShowNewModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creando suscripción:', error);
      toast.error('Error al crear la suscripción');
    }
  };

  const handleRenewSubscription = async (subscription: MonthlySubscription) => {
    try {
      const dualDB = getDualDB();
      
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      // Calcular nueva fecha de vencimiento basada en el tipo original
      switch (subscription.subscriptionType) {
        case 'daily':
          endDate.setDate(endDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'biweekly':
          endDate.setDate(endDate.getDate() + 15);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'custom':
          endDate.setDate(endDate.getDate() + (subscription.customDays || 30));
          break;
      }
      
      const renewedSubscription: MonthlySubscription = {
        ...subscription,
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startDate,
        endDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await dualDB.saveMonthlySubscription(renewedSubscription);
      
      toast.success('Suscripción renovada exitosamente');
      await loadSubscriptions();
    } catch (error) {
      console.error('Error renovando suscripción:', error);
      toast.error('Error al renovar la suscripción');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción?')) {
      return;
    }

    try {
      const dualDB = getDualDB();
      const subscription = await dualDB.getMonthlySubscription(subscriptionId);
      
      if (subscription) {
        subscription.isActive = false;
        subscription.updatedAt = new Date();
        await dualDB.updateMonthlySubscription(subscription);
        
        toast.success('Suscripción cancelada');
        await loadSubscriptions();
      }
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      toast.error('Error al cancelar la suscripción');
    }
  };

  const resetForm = () => {
    setNewSubscription({
      vehiclePlate: '',
      vehicleType: 'car',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      subscriptionType: 'monthly',
      customDays: 30,
      amount: 0,
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const getSubscriptionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Diario',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      custom: 'Personalizado'
    };
    return labels[type] || type;
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (subscription: MonthlySubscription) => {
    if (!subscription.isActive) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const daysRemaining = getDaysRemaining(subscription.endDate);
    
    if (daysRemaining < 0) {
      return 'bg-red-100 text-red-800';
    } else if (daysRemaining <= 3) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (subscription: MonthlySubscription) => {
    if (!subscription.isActive) {
      return <XCircle className="w-4 h-4" />;
    }
    
    const daysRemaining = getDaysRemaining(subscription.endDate);
    
    if (daysRemaining < 0) {
      return <AlertCircle className="w-4 h-4" />;
    } else if (daysRemaining <= 3) {
      return <Clock className="w-4 h-4" />;
    } else {
      return <CheckCircle className="w-4 h-4" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    // Filtro por estado
    const statusMatch = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? sub.isActive :
      filterStatus === 'expired' ? (!sub.isActive || getDaysRemaining(sub.endDate) < 0) : true;
    
    // Filtro por búsqueda
    const searchMatch = !searchTerm || 
      sub.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.clientPhone.includes(searchTerm);
    
    return statusMatch && searchMatch;
  });

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header con mismo estilo del parqueadero */}
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
              <div className="flex items-center gap-4 mb-1">
                <span className="text-xs font-medium text-green-600">Bienvenido Wilson González</span>
              </div>
              <div className="text-sm font-mono font-bold text-gray-800">{currentTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Title Section y botón de nueva suscripción */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Clientes Mensuales</h2>
                <p className="text-gray-600 text-sm">Gestión de suscripciones y clientes recurrentes</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nueva Suscripción
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por placa, nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-5 h-5 text-gray-500" />
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filterStatus === 'active'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Activas
            </button>
            <button
              onClick={() => setFilterStatus('expired')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filterStatus === 'expired'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ❌ Vencidas
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Todas
            </button>
            <button
              onClick={loadSubscriptions}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Suscripciones */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando suscripciones...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay suscripciones</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Crea una nueva suscripción para comenzar'}
            </p>
          </div>
        ) : (
            <div className="divide-y divide-gray-100">
              {filteredSubscriptions.map((subscription, index) => (
                <motion.div
                  key={subscription.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        <Car className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {subscription.vehiclePlate}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(subscription)}`}>
                            {getStatusIcon(subscription)}
                            {subscription.isActive ? (
                              getDaysRemaining(subscription.endDate) < 0 ? 'Vencida' :
                              getDaysRemaining(subscription.endDate) <= 3 ? `Vence en ${getDaysRemaining(subscription.endDate)}d` :
                              'Activa'
                            ) : 'Cancelada'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <User className="w-4 h-4 inline mr-1" />
                          {subscription.clientName}
                          {subscription.clientPhone && (
                            <span className="ml-4">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {subscription.clientPhone}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getSubscriptionTypeLabel(subscription.subscriptionType)} • 
                          {' '}Desde: {new Date(subscription.startDate).toLocaleDateString('es-CO')} • 
                          {' '}Hasta: {new Date(subscription.endDate).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${subscription.amount.toLocaleString('es-CO')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getSubscriptionTypeLabel(subscription.subscriptionType)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const { printMonthlySubscriptionInvoice } = await import('./PrintFallback');
                              await printMonthlySubscriptionInvoice(subscription);
                              toast.success('Imprimiendo factura...');
                            } catch (error) {
                              console.error('Error imprimiendo:', error);
                              toast.error('Error al imprimir factura');
                            }
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Imprimir factura"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        {subscription.isActive && getDaysRemaining(subscription.endDate) >= 0 && (
                          <button
                            onClick={() => handleCancelSubscription(subscription.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar suscripción"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        {(!subscription.isActive || getDaysRemaining(subscription.endDate) <= 7) && (
                          <button
                            onClick={() => handleRenewSubscription(subscription)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Renovar suscripción"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
        )}
      </div>

      {/* Modal: Nueva Suscripción */}
        <AnimatePresence>
          {showNewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Nueva Suscripción</h2>
                  <button
                    onClick={() => {
                      setShowNewModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubscription} className="space-y-4">
                  {/* Información del Vehículo */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Información del Vehículo</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placa *
                        </label>
                        <input
                          type="text"
                          value={newSubscription.vehiclePlate}
                          onChange={(e) => setNewSubscription({ ...newSubscription, vehiclePlate: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                          placeholder="ABC123"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Vehículo
                        </label>
                        <select
                          value={newSubscription.vehicleType}
                          onChange={(e) => setNewSubscription({ ...newSubscription, vehicleType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="car">Carro</option>
                          <option value="motorcycle">Moto</option>
                          <option value="truck">Camioneta</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Información del Cliente */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Información del Cliente</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          value={newSubscription.clientName}
                          onChange={(e) => setNewSubscription({ ...newSubscription, clientName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono *
                          </label>
                          <input
                            type="tel"
                            value={newSubscription.clientPhone}
                            onChange={(e) => setNewSubscription({ ...newSubscription, clientPhone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="3001234567"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email (opcional)
                          </label>
                          <input
                            type="email"
                            value={newSubscription.clientEmail}
                            onChange={(e) => setNewSubscription({ ...newSubscription, clientEmail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="cliente@email.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de Suscripción */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Información de Suscripción</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Suscripción
                        </label>
                        <select
                          value={newSubscription.subscriptionType}
                          onChange={(e) => setNewSubscription({ ...newSubscription, subscriptionType: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="daily">Diario (1 día)</option>
                          <option value="weekly">Semanal (7 días)</option>
                          <option value="biweekly">Quincenal (15 días)</option>
                          <option value="monthly">Mensual (30 días)</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                      {newSubscription.subscriptionType === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Días
                          </label>
                          <input
                            type="number"
                            value={newSubscription.customDays}
                            onChange={(e) => setNewSubscription({ ...newSubscription, customDays: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            min="1"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monto *
                        </label>
                        <input
                          type="number"
                          value={newSubscription.amount}
                          onChange={(e) => setNewSubscription({ ...newSubscription, amount: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="50000"
                          min="0"
                          step="1000"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Método de Pago
                        </label>
                        <select
                          value={newSubscription.paymentMethod}
                          onChange={(e) => setNewSubscription({ ...newSubscription, paymentMethod: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="cash">Efectivo</option>
                          <option value="card">Tarjeta</option>
                          <option value="transfer">Transferencia</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas (opcional)
                      </label>
                      <textarea
                        value={newSubscription.notes}
                        onChange={(e) => setNewSubscription({ ...newSubscription, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={3}
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>

                  {/* Fecha de vencimiento calculada */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                      <strong>Fecha de vencimiento:</strong> {calculateEndDate().toLocaleDateString('es-CO', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Suscripción
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default MonthlySubscriptionManager;
