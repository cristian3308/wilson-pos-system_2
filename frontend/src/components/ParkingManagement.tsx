'use client';

import React, { useState, useEffect } from 'react';
import { Car, Clock, DollarSign, Plus, Search, X, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { getDualDB, Vehicle, ParkingTicket, BusinessConfig } from '../lib/dualDatabase';
import ParkingReportManagement from './ParkingReportManagement';

interface ParkingManagementProps {
  className?: string;
}

export default function ParkingManagement({ className }: ParkingManagementProps) {
  const [activeTickets, setActiveTickets] = useState<ParkingTicket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<ParkingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showParkingReport, setShowParkingReport] = useState(false);

  // Form para entrada de vehículo
  const [vehicleForm, setVehicleForm] = useState({
    placa: '',
    tipo: 'car' as 'car' | 'motorcycle' | 'truck',
    color: '',
    modelo: '',
    propietario: '',
    telefono: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = getDualDB();
      
      const [active, completed, config] = await Promise.all([
        db.getParkingTickets('active'),
        db.getParkingTickets('completed'),
        db.getBusinessConfig()
      ]);

      console.log('🅿️ Tickets activos cargados:', active);
      console.log('✅ Tickets completados cargados:', completed);

      setActiveTickets(active);
      setCompletedTickets(completed.slice(0, 10)); // Solo últimos 10
      setBusinessConfig(config);
    } catch (error) {
      console.error('Error loading parking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const db = getDualDB();
      
      // Verificar si ya hay un ticket activo para esta placa
      const activeTickets = await db.getParkingTickets('active');
      const existingTicket = activeTickets.find(t => t.placa.toUpperCase() === vehicleForm.placa.toUpperCase());
      if (existingTicket) {
        alert('¡Este vehículo ya tiene un ticket activo!');
        return;
      }

      // Crear el ticket
      await db.saveParkingTicket({
        placa: vehicleForm.placa.toUpperCase(),
        tipo: vehicleForm.tipo,
        color: vehicleForm.color,
        modelo: vehicleForm.modelo,
        propietario: vehicleForm.propietario,
        telefono: vehicleForm.telefono
      });

      // Limpiar formulario y recargar datos
      setVehicleForm({
        placa: '',
        tipo: 'car',
        color: '',
        modelo: '',
        propietario: '',
        telefono: ''
      });
      setShowEntryForm(false);
      await loadData();

      alert('¡Ticket de entrada creado exitosamente!');
    } catch (error) {
      console.error('Error creating parking ticket:', error);
      alert('Error al crear el ticket');
    }
  };

  const handleVehicleExit = async (ticketId: string) => {
    try {
      // Verificar que el ticket existe y está activo
      const currentTicket = activeTickets.find(t => t.id === ticketId);
      if (!currentTicket) {
        alert('Ticket no encontrado o ya procesado');
        return;
      }

      if (currentTicket.status !== 'active') {
        alert('Este ticket ya fue procesado');
        await loadData(); // Refrescar datos
        return;
      }

      console.log('🚗 Procesando salida de vehículo:', ticketId, currentTicket.placa);

      const db = getDualDB();
      const completedTicket = await db.completeParkingTicket(ticketId);
      
      // Mostrar resumen del pago
      const totalHours = Math.ceil((completedTicket.totalMinutes || 0) / 60);
      const message = `
        Vehículo: ${completedTicket.placa}
        Tiempo: ${completedTicket.totalMinutes} minutos (${totalHours} horas)
        Total a pagar: $${completedTicket.totalAmount?.toLocaleString()}
      `;
      
      console.log('✅ Ticket completado:', completedTicket);
      
      // Refrescar datos inmediatamente
      await loadData();
      alert(`¡Ticket completado exitosamente!\n${message}`);
    } catch (error) {
      console.error('❌ Error completing parking ticket:', error);
      alert(`Error al completar el ticket: ${error}`);
      // Refrescar datos en caso de error también
      await loadData();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString();
  };

  const calculateDuration = (entryTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(entryTime).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateCurrentPrice = (ticket: ParkingTicket) => {
    if (!businessConfig) return 0;
    
    const now = new Date();
    const db = getDualDB();
    const rate = businessConfig?.carParkingRate || 5000;
    const entryTime = new Date(ticket.entryTime);
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return diffHours * rate;
  };

  const vehicleTypeNames: Record<string, string> = {
    car: 'Carro',
    motorcycle: 'Moto', 
    truck: 'Camión'
  };

  const getVehicleTypeName = (type: string): string => {
    // Si es un tipo predeterminado, usar el nombre del mapeo
    if (vehicleTypeNames[type]) {
      return vehicleTypeNames[type];
    }
    // Si es un tipo personalizado, retornar el tipo tal cual (será resuelto más adelante)
    return type;
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle': return '🏍️';
      case 'truck': return '🚛';
      default: return '🚗';
    }
  };

  const filteredActiveTickets = activeTickets.filter(ticket => 
    ticket.placa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-400">Cargando datos del parqueadero...</div>
      </div>
    );
  }

  // Si estamos viendo el reporte, mostrar ese componente
  if (showParkingReport) {
    return <ParkingReportManagement />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Parqueadero</h2>
          <p className="text-gray-400">
            {businessConfig?.businessName || 'Wilson Cars & Wash'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowParkingReport(!showParkingReport)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            <BarChart3 size={20} />
            {showParkingReport ? 'Ver Parqueadero' : 'Ver Reportes'}
          </button>
          <button
            onClick={() => setShowEntryForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Registrar Entrada
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Car className="text-blue-500" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Vehículos Activos</p>
              <p className="text-2xl font-bold text-white">{activeTickets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Completados Hoy</p>
              <p className="text-2xl font-bold text-white">{completedTickets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="text-yellow-500" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-white">
                ${completedTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="text-purple-500" size={24} />
            <div>
              <p className="text-gray-400 text-sm">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-white">2.5h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Active Tickets */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Vehículos en el Parqueadero ({filteredActiveTickets.length})
        </h3>
        
        {filteredActiveTickets.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay vehículos activos</p>
        ) : (
          <div className="grid gap-4">
            {filteredActiveTickets.map((ticket) => (
              <div key={ticket.id} className="bg-slate-700 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getVehicleIcon(ticket.vehicleType)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">{ticket.placa}</span>
                      <span className="text-sm text-gray-400">
                        {getVehicleTypeName(ticket.vehicleType)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Entrada: {formatTime(ticket.entryTime)} • 
                      Duración: {calculateDuration(ticket.entryTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Precio actual</p>
                    <TicketPrice 
                      ticket={ticket} 
                      businessConfig={businessConfig} 
                    />
                  </div>
                  <button
                    onClick={() => handleVehicleExit(ticket.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Salida
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de entrada */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Registrar Entrada de Vehículo</h3>
              <button
                onClick={() => setShowEntryForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleVehicleEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Placa (Requerido)
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.placa}
                  onChange={(e) => setVehicleForm({...vehicleForm, placa: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="ABC-123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Vehículo
                </label>
                <select
                  value={vehicleForm.tipo}
                  onChange={(e) => setVehicleForm({...vehicleForm, tipo: e.target.value as any})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="truck">Camión</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.color}
                    onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Blanco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.modelo}
                    onChange={(e) => setVehicleForm({...vehicleForm, modelo: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Toyota"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Propietario
                </label>
                <input
                  type="text"
                  value={vehicleForm.propietario}
                  onChange={(e) => setVehicleForm({...vehicleForm, propietario: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={vehicleForm.telefono}
                  onChange={(e) => setVehicleForm({...vehicleForm, telefono: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="123-456-7890"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente helper para mostrar precio en tiempo real
function TicketPrice({ ticket, businessConfig }: { ticket: ParkingTicket, businessConfig: BusinessConfig | null }) {
  const [price, setPrice] = useState(ticket.basePrice);

  useEffect(() => {
    if (!businessConfig) return;

    const updatePrice = async () => {
      const db = getDualDB();
      const rate = businessConfig?.carParkingRate || 5000;
      const entryTime = new Date(ticket.entryTime);
      const now = new Date();
      const diffMs = now.getTime() - entryTime.getTime();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const currentPrice = diffHours * rate;
      setPrice(currentPrice);
    };

    updatePrice();
    const interval = setInterval(updatePrice, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [ticket, businessConfig]);

  return <p className="text-lg font-bold text-green-400">${price.toLocaleString()}</p>;
}