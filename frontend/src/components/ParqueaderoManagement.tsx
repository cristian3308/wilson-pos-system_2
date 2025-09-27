'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Bike, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Calendar,
  RefreshCw,
  Edit3,
  Trash2
} from 'lucide-react';
import { useSystem } from '@/contexts/SystemContext';
import { Vehicle, formatCurrency, formatTime, calculateDuration } from '@/types';

type ParkingMode = 'entrada' | 'salida' | 'gestion';

export default function ParqueaderoManagement() {
  const { state, actions } = useSystem();
  const { vehicles, loadingStates, errors } = state;
  
  const [mode, setMode] = useState<ParkingMode>('entrada');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'carro' | 'moto' | 'bicicleta'>('all');
  
  // Form states
  const [entryForm, setEntryForm] = useState({
    placa: '',
    tipoVehiculo: 'carro' as 'carro' | 'moto' | 'bicicleta',
    propietario: '',
    telefono: '',
    observaciones: ''
  });
  
  const [exitForm, setExitForm] = useState({
    placa: '',
    metodoPago: 'efectivo' as 'efectivo' | 'tarjeta' | 'transferencia'
  });

  const isLoading = loadingStates.parking === 'loading';

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vehicle.propietario?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filterType === 'all' || vehicle.tipoVehiculo === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // API call to register vehicle entry
      actions.addNotification({
        type: 'success',
        title: 'Vehículo Registrado',
        message: `Vehículo ${entryForm.placa} registrado exitosamente`
      });
      
      setEntryForm({
        placa: '',
        tipoVehiculo: 'carro',
        propietario: '',
        telefono: '',
        observaciones: ''
      });
      
      // Refresh vehicles
      actions.loadVehicles();
      
    } catch (error) {
      actions.addNotification({
        type: 'error',
        title: 'Error de Registro',
        message: 'No se pudo registrar el vehículo'
      });
    }
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // API call to process vehicle exit
      actions.addNotification({
        type: 'success',
        title: 'Salida Procesada',
        message: `Salida del vehículo ${exitForm.placa} procesada exitosamente`
      });
      
      setExitForm({
        placa: '',
        metodoPago: 'efectivo'
      });
      
      // Refresh vehicles and dashboard
      actions.loadVehicles();
      actions.loadDashboardMetrics();
      
    } catch (error) {
      actions.addNotification({
        type: 'error',
        title: 'Error de Salida',
        message: 'No se pudo procesar la salida del vehículo'
      });
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'carro': return Car;
      case 'moto': return Bike;
      case 'bicicleta': return Bike;
      default: return Car;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-500';
      case 'vencido': return 'bg-red-500';
      case 'pagado': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Gestión de Parqueadero
            </h1>
            <p className="text-green-200 text-lg">
              Control total de vehículos y espacios de estacionamiento
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={actions.loadVehicles}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
            { id: 'entrada', label: 'Entrada de Vehículos', icon: Plus },
            { id: 'salida', label: 'Salida de Vehículos', icon: DollarSign },
            { id: 'gestion', label: 'Gestión y Monitoreo', icon: Activity }
          ].map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setMode(item.id as ParkingMode)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all ${
                mode === item.id
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                  : 'bg-white/10 text-green-200 hover:bg-white/20'
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
          {mode === 'entrada' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6" />
                Registro de Entrada
              </h2>
              
              <form onSubmit={handleEntrySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Placa */}
                  <div>
                    <label className="block text-green-200 font-medium mb-2">
                      Placa del Vehículo *
                    </label>
                    <input
                      type="text"
                      value={entryForm.placa}
                      onChange={(e) => setEntryForm({ ...entryForm, placa: e.target.value.toUpperCase() })}
                      placeholder="ABC123"
                      className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-green-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                      required
                    />
                  </div>

                  {/* Tipo de Vehículo */}
                  <div>
                    <label className="block text-green-200 font-medium mb-2">
                      Tipo de Vehículo *
                    </label>
                    <select
                      value={entryForm.tipoVehiculo}
                      onChange={(e) => setEntryForm({ ...entryForm, tipoVehiculo: e.target.value as any })}
                      className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                      required
                    >
                      <option value="carro">🚗 Carro</option>
                      <option value="moto">🏍️ Moto</option>
                      <option value="bicicleta">🚲 Bicicleta</option>
                    </select>
                  </div>

                  {/* Propietario */}
                  <div>
                    <label className="block text-green-200 font-medium mb-2">
                      Nombre del Propietario
                    </label>
                    <input
                      type="text"
                      value={entryForm.propietario}
                      onChange={(e) => setEntryForm({ ...entryForm, propietario: e.target.value })}
                      placeholder="Nombre completo"
                      className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-green-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-green-200 font-medium mb-2">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={entryForm.telefono}
                      onChange={(e) => setEntryForm({ ...entryForm, telefono: e.target.value })}
                      placeholder="3001234567"
                      className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-green-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-green-200 font-medium mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={entryForm.observaciones}
                    onChange={(e) => setEntryForm({ ...entryForm, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white placeholder-green-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Registrar Entrada
                </button>
              </form>
            </div>
          )}

          {mode === 'salida' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <DollarSign className="w-6 h-6" />
                Procesamiento de Salida
              </h2>
              
              <form onSubmit={handleExitSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Placa */}
                  <div>
                    <label className="block text-green-200 font-medium mb-2">
                      Placa del Vehículo *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={exitForm.placa}
                        onChange={(e) => setExitForm({ ...exitForm, placa: e.target.value.toUpperCase() })}
                        placeholder="ABC123"
                        className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-green-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                        required
                      />
                      <Search className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                    </div>
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="block text-green-200 font-medium mb-2">
                      Método de Pago *
                    </label>
                    <select
                      value={exitForm.metodoPago}
                      onChange={(e) => setExitForm({ ...exitForm, metodoPago: e.target.value as any })}
                      className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                      required
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">📱 Transferencia</option>
                    </select>
                  </div>
                </div>

                {/* Cálculo de costo simulado */}
                <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Resumen de Facturación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-green-200 text-sm">Tiempo Transcurrido</p>
                      <p className="text-2xl font-bold text-white">2h 30m</p>
                    </div>
                    <div>
                      <p className="text-green-200 text-sm">Tarifa por Hora</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(3000)}</p>
                    </div>
                    <div>
                      <p className="text-green-200 text-sm">Total a Pagar</p>
                      <p className="text-3xl font-bold text-green-300">{formatCurrency(7500)}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <DollarSign className="w-5 h-5" />
                  )}
                  Procesar Salida y Cobro
                </button>
              </form>
            </div>
          )}

          {mode === 'gestion' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por placa o propietario..."
                        className="w-full bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-green-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                      />
                      <Search className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                    </div>
                    
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="bg-white/10 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                    >
                      <option value="all">Todos los Vehículos</option>
                      <option value="carro">Solo Carros</option>
                      <option value="moto">Solo Motos</option>
                      <option value="bicicleta">Solo Bicicletas</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Exportar
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredVehicles.map((vehicle, index) => {
                    const VehicleIcon = getVehicleIcon(vehicle.tipoVehiculo);
                    
                    return (
                      <motion.div
                        key={vehicle.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-green-400/50 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-600/20 p-3 rounded-lg">
                              <VehicleIcon className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{vehicle.placa}</h3>
                              <p className="text-green-200 text-sm capitalize">{vehicle.tipoVehiculo}</p>
                            </div>
                          </div>
                          
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.estado)}`} />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-green-200 text-sm">Espacio:</span>
                            <span className="text-white font-medium">{vehicle.espacioAsignado}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-green-200 text-sm">Entrada:</span>
                            <span className="text-white font-medium">
                              {formatTime(vehicle.horaEntrada)}
                            </span>
                          </div>
                          
                          {vehicle.tiempoTranscurrido && (
                            <div className="flex items-center justify-between">
                              <span className="text-green-200 text-sm">Tiempo:</span>
                              <span className="text-white font-medium">{vehicle.tiempoTranscurrido}</span>
                            </div>
                          )}
                          
                          {vehicle.costoActual && (
                            <div className="flex items-center justify-between">
                              <span className="text-green-200 text-sm">Costo:</span>
                              <span className="text-green-300 font-bold">
                                {formatCurrency(vehicle.costoActual)}
                              </span>
                            </div>
                          )}

                          {vehicle.propietario && (
                            <div className="mt-4 pt-3 border-t border-green-500/20">
                              <p className="text-green-200 text-sm">Propietario:</p>
                              <p className="text-white font-medium">{vehicle.propietario}</p>
                              {vehicle.telefono && (
                                <p className="text-green-300 text-sm">{vehicle.telefono}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            Editar
                          </button>
                          <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {filteredVehicles.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Car className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">No hay vehículos</h3>
                  <p className="text-green-200">
                    {searchTerm || filterType !== 'all' 
                      ? 'No se encontraron vehículos con los filtros aplicados'
                      : 'No hay vehículos registrados en el parqueadero'
                    }
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}