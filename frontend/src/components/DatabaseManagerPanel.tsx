'use client';

import React, { useState, useEffect } from 'react';
import { getLocalDB } from '../lib/localDatabase';
import { parkingSystem } from '../lib/parkingSystem';
import { getDualDB } from '../lib/dualDatabase';
import type { ParkingTicket } from '../lib/localDatabase';

type VehicleType = 'car' | 'motorcycle' | 'truck';

interface DatabaseManagerPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  status: 'todos' | 'activos' | 'pagados';
  vehicleType: VehicleType | 'todos';
  placa: string;
}

interface CarwashOrder {
  id: string;
  placaVehiculo: string;
  servicios: any[];
  estado: string;
  total: number;
  fechaCreacion: string;
  fechaFinalizacion?: string;
  observaciones?: string;
}

export function DatabaseManagerPanel({ isVisible, onClose }: DatabaseManagerPanelProps) {
  const db = getLocalDB();
  const [activeTab, setActiveTab] = useState<'parking' | 'carwash'>('parking');
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [carwashOrders, setCarwashOrders] = useState<CarwashOrder[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ParkingTicket[]>([]);
  const [filteredCarwashOrders, setFilteredCarwashOrders] = useState<CarwashOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ParkingTicket | null>(null);
  const [selectedCarwashOrder, setSelectedCarwashOrder] = useState<CarwashOrder | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    status: 'todos',
    vehicleType: 'todos',
    placa: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    pagados: 0,
    ingresoHoy: 0
  });

  const [carwashStats, setCarwashStats] = useState({
    total: 0,
    pendientes: 0,
    completadas: 0,
    ingresoHoy: 0
  });

  // Cargar datos de lavadero
  const loadCarwashOrders = async () => {
    setIsLoading(true);
    try {
      const dualDB = getDualDB();
      const orders = await dualDB.getAllCarwashTransactions();
      setCarwashOrders(orders);
      setFilteredCarwashOrders(orders);
      calculateCarwashStats(orders);
    } catch (error) {
      console.error('Error cargando órdenes de lavadero:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas del lavadero
  const calculateCarwashStats = (orderData: CarwashOrder[]) => {
    const today = new Date().toDateString();
    const todayOrders = orderData.filter(o => new Date(o.fechaCreacion).toDateString() === today);
    
    const pendientes = orderData.filter(o => o.estado === 'pendiente' || o.estado === 'en_proceso').length;
    const completadas = orderData.filter(o => o.estado === 'completado').length;
    
    const ingresoHoy = todayOrders
      .filter(o => o.estado === 'completado' && o.total)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    setCarwashStats({
      total: orderData.length,
      pendientes,
      completadas,
      ingresoHoy
    });
  };

  // Filtrar órdenes de lavadero
  const applyCarwashFilters = () => {
    let filtered = [...carwashOrders];

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(o => new Date(o.fechaCreacion) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(o => new Date(o.fechaCreacion) <= toDate);
    }

    if (filters.status === 'activos') {
      filtered = filtered.filter(o => o.estado === 'pendiente' || o.estado === 'en_proceso');
    } else if (filters.status === 'pagados') {
      filtered = filtered.filter(o => o.estado === 'completado');
    }

    if (filters.placa.trim()) {
      filtered = filtered.filter(o => 
        o.placaVehiculo.toLowerCase().includes(filters.placa.toLowerCase())
      );
    }

    setFilteredCarwashOrders(filtered);
  };
  // Cargar tickets
  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const allTickets = await db.getParkingTickets();
      setTickets(allTickets);
      setFilteredTickets(allTickets);
      calculateStats(allTickets);
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Editar orden de lavadero
  const handleEditCarwashOrder = (order: CarwashOrder) => {
    setSelectedCarwashOrder(order);
    setEditForm({ ...order });
    setShowEditModal(true);
  };

  // Guardar edición de orden de lavadero
  const saveCarwashEdit = async () => {
    if (!selectedCarwashOrder || !editForm.id) return;

    try {
      const dualDB = getDualDB();
      const updatedOrder: CarwashOrder = {
        ...selectedCarwashOrder,
        ...editForm,
        updatedAt: new Date()
      };

      await dualDB.updateCarwashTransaction(updatedOrder);
      await loadCarwashOrders();
      setShowEditModal(false);
      setSelectedCarwashOrder(null);
      setEditForm({});
    } catch (error) {
      console.error('Error actualizando orden de lavadero:', error);
      alert('Error al actualizar la orden');
    }
  };

  // Eliminar orden de lavadero
  const deleteCarwashOrder = async () => {
    if (!selectedCarwashOrder) return;

    try {
      const dualDB = getDualDB();
      await dualDB.deleteCarwashTransaction(selectedCarwashOrder.id);
      await loadCarwashOrders();
      setShowDeleteModal(false);
      setSelectedCarwashOrder(null);
    } catch (error) {
      console.error('Error eliminando orden de lavadero:', error);
      alert('Error al eliminar la orden');
    }
  };

  // Calcular estadísticas
  const calculateStats = (ticketData: ParkingTicket[]) => {
    const today = new Date().toDateString();
    const todayTickets = ticketData.filter(t => new Date(t.entryTime).toDateString() === today);
    
    const activos = ticketData.filter(t => !t.exitTime).length;
    const pagados = ticketData.filter(t => t.exitTime).length;
    
    const ingresoHoy = todayTickets
      .filter(t => t.exitTime && t.totalAmount)
      .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    setStats({
      total: ticketData.length,
      activos,
      pagados,
      ingresoHoy
    });
  };

  // Filtrar tickets
  const applyFilters = () => {
    let filtered = [...tickets];

    // Filtro por fecha
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(t => new Date(t.entryTime) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(t => new Date(t.entryTime) <= toDate);
    }

    // Filtro por status
    if (filters.status === 'activos') {
      filtered = filtered.filter(t => !t.exitTime);
    } else if (filters.status === 'pagados') {
      filtered = filtered.filter(t => t.exitTime);
    }

    // Filtro por tipo de vehículo
    if (filters.vehicleType !== 'todos') {
      filtered = filtered.filter(t => t.vehicleType === filters.vehicleType);
    }

    // Filtro por placa
    if (filters.placa.trim()) {
      filtered = filtered.filter(t => 
        t.placa.toLowerCase().includes(filters.placa.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  // Editar ticket
  const handleEdit = (ticket: ParkingTicket) => {
    setSelectedTicket(ticket);
    setEditForm({ ...ticket });
    setShowEditModal(true);
  };

  // Guardar edición
  const saveEdit = async () => {
    if (!selectedTicket || !editForm.id) return;

    try {
      const updatedTicket: ParkingTicket = {
        ...selectedTicket,
        ...editForm,
        updatedAt: new Date()
      };

      await db.updateParkingTicket(updatedTicket);
      await loadTickets();
      setShowEditModal(false);
      setSelectedTicket(null);
      setEditForm({});
    } catch (error) {
      console.error('Error actualizando ticket:', error);
      alert('Error al actualizar el ticket');
    }
  };

  // Eliminar ticket
  const deleteTicket = async () => {
    if (!selectedTicket) return;

    try {
      await db.deleteParkingTicket(selectedTicket.id);
      await loadTickets();
      setShowDeleteModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error eliminando ticket:', error);
      alert('Error al eliminar el ticket');
    }
  };

  // Limpiar base de datos (tickets pagados más de 30 días)
  const cleanOldTickets = async () => {
    if (!confirm('¿Eliminar tickets pagados de más de 30 días?')) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    try {
      const oldTickets = tickets.filter(t => 
        t.exitTime && new Date(t.exitTime) < cutoffDate
      );

      for (const ticket of oldTickets) {
        await db.deleteParkingTicket(ticket.id);
      }

      await loadTickets();
      alert(`Se eliminaron ${oldTickets.length} tickets antiguos`);
    } catch (error) {
      console.error('Error limpiando tickets:', error);
      alert('Error al limpiar tickets');
    }
  };

  // Exportar datos
  const exportData = () => {
    const csvData = filteredTickets.map(t => ({
      ID: t.id,
      Placa: t.placa,
      Vehiculo: t.vehicleType,
      Entrada: new Date(t.entryTime).toLocaleString(),
      Salida: t.exitTime ? new Date(t.exitTime).toLocaleString() : 'ACTIVO',
      Tiempo: t.totalMinutes ? `${t.totalMinutes} min` : 'N/A',
      Total: t.totalAmount || 0,
      Estado: t.exitTime ? 'PAGADO' : 'ACTIVO'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isVisible) {
      if (activeTab === 'parking') {
        loadTickets();
      } else {
        loadCarwashOrders();
      }
    }
  }, [isVisible, activeTab]);

  useEffect(() => {
    if (activeTab === 'parking') {
      applyFilters();
    } else {
      applyCarwashFilters();
    }
  }, [filters, tickets, carwashOrders, activeTab]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            🗄️ Panel de Administración de Base de Datos
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('parking')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'parking'
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              🚗 Parqueadero
            </button>
            <button
              onClick={() => setActiveTab('carwash')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 ${
                activeTab === 'carwash'
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              🧽 Lavadero
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeTab === 'parking' ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Tickets</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                  <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
                  <div className="text-sm text-gray-600">Activos</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">{stats.pagados}</div>
                  <div className="text-sm text-gray-600">Pagados</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${stats.ingresoHoy.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Ingreso Hoy</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{carwashStats.total}</div>
                  <div className="text-sm text-gray-600">Total Órdenes</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">{carwashStats.pendientes}</div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                  <div className="text-2xl font-bold text-green-600">{carwashStats.completadas}</div>
                  <div className="text-sm text-gray-600">Completadas</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${carwashStats.ingresoHoy.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Ingreso Hoy</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filtros y Controles */}
        <div className="p-6 border-b bg-white">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="activos">{activeTab === 'parking' ? 'Activos' : 'Pendientes'}</option>
                <option value="pagados">{activeTab === 'parking' ? 'Pagados' : 'Completadas'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vehículo
              </label>
              <select
                value={filters.vehicleType}
                onChange={(e) => setFilters(prev => ({ ...prev, vehicleType: e.target.value as any }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="car">Carro</option>
                <option value="motorcycle">Moto</option>
                <option value="truck">Camión</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Placa
              </label>
              <input
                type="text"
                placeholder="Buscar placa..."
                value={filters.placa}
                onChange={(e) => setFilters(prev => ({ ...prev, placa: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  dateFrom: '',
                  dateTo: '',
                  status: 'todos',
                  vehicleType: 'todos',
                  placa: ''
                })}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                🧹 Limpiar
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={activeTab === 'parking' ? loadTickets : loadCarwashOrders}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              🔄 Recargar
            </button>
            <button
              onClick={exportData}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              📊 Exportar CSV
            </button>
            {activeTab === 'parking' && (
              <button
                onClick={cleanOldTickets}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                🧹 Limpiar Antiguos
              </button>
            )}
          </div>
        </div>

        {/* Contenido de la tabla */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-lg text-gray-600">Cargando...</div>
            </div>
          ) : activeTab === 'parking' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Placa</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Vehículo</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Entrada</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Salida</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Tiempo</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Estado</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-xs">{ticket.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold text-blue-600">{ticket.placa}</td>
                    <td className="p-3">{ticket.vehicleType}</td>
                    <td className="p-3 text-xs">
                      {new Date(ticket.entryTime).toLocaleString()}
                    </td>
                    <td className="p-3 text-xs">
                      {ticket.exitTime ? new Date(ticket.exitTime).toLocaleString() : '-'}
                    </td>
                    <td className="p-3">{ticket.totalMinutes ? `${ticket.totalMinutes} min` : '-'}</td>
                    <td className="p-3 font-bold">
                      ${ticket.totalAmount?.toLocaleString() || '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.exitTime 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ticket.exitTime ? 'PAGADO' : 'ACTIVO'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(ticket)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowDeleteModal(true);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-colors"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Placa</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Servicios</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Fecha Creación</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Estado</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Total</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarwashOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold text-blue-600">{order.placaVehiculo}</td>
                    <td className="p-3 text-xs">
                      {order.servicios?.map(s => s.nombre || s.serviceName).join(', ') || 'N/A'}
                    </td>
                    <td className="p-3 text-xs">
                      {new Date(order.fechaCreacion).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.estado === 'completado' ? 'bg-green-100 text-green-800' :
                        order.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {order.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      ${order.total?.toLocaleString() || '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCarwashOrder(order)}
                          className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCarwashOrder(order);
                            setShowDeleteModal(true);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-colors"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie con total de registros */}
        <div className="p-4 bg-gray-100 text-sm text-gray-600 border-t flex justify-between items-center">
          <div>
            Mostrando {activeTab === 'parking' ? filteredTickets.length : filteredCarwashOrders.length} de {activeTab === 'parking' ? tickets.length : carwashOrders.length} registros
          </div>
          <div className="text-xs text-gray-500">
            {activeTab === 'parking' ? '🚗 Parqueadero' : '🧽 Lavadero'}
          </div>
        </div>
      </div>

      {/* Modales de edición y eliminación */}
      {showEditModal && (selectedTicket || selectedCarwashOrder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Editar {activeTab === 'parking' ? 'Ticket' : 'Orden de Lavadero'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={editForm.placa || editForm.placaVehiculo || ''}
                  onChange={(e) => setEditForm((prev: any) => ({ 
                    ...prev, 
                    ...(activeTab === 'parking' ? { placa: e.target.value } : { placaVehiculo: e.target.value })
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {activeTab === 'parking' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Vehículo
                    </label>
                    <select
                      value={editForm.vehicleType || ''}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, vehicleType: e.target.value as VehicleType }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="car">Carro</option>
                      <option value="motorcycle">Moto</option>
                      <option value="truck">Camión</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total a Pagar
                    </label>
                    <input
                      type="number"
                      value={editForm.totalAmount || 0}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, totalAmount: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {activeTab === 'carwash' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={editForm.estado || ''}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, estado: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <input
                      type="number"
                      value={editForm.total || 0}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, total: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={editForm.observaciones || ''}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, observaciones: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={activeTab === 'parking' ? saveEdit : saveCarwashEdit}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                💾 Guardar
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTicket(null);
                  setSelectedCarwashOrder(null);
                  setEditForm({});
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (selectedTicket || selectedCarwashOrder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2">
              ⚠️ Confirmar Eliminación
            </h3>
            <p className="mb-6 text-gray-700">
              ¿Está seguro de que desea eliminar {activeTab === 'parking' ? 'el ticket' : 'la orden'} de la placa{' '}
              <strong className="text-blue-600">
                {activeTab === 'parking' ? selectedTicket?.placa : selectedCarwashOrder?.placaVehiculo}
              </strong>?
            </p>
            <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
              ⚠️ Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={activeTab === 'parking' ? deleteTicket : deleteCarwashOrder}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                🗑️ Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTicket(null);
                  setSelectedCarwashOrder(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}