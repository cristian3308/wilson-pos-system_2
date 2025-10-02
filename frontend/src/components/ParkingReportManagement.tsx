'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Calendar, 
  Clock, 
  DollarSign,
  Download,
  Filter,
  TrendingUp,
  MapPin,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getDualDB, ParkingTicket } from '@/lib/dualDatabase';
import toast from 'react-hot-toast';

type PeriodType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

interface ParkingStats {
  totalTickets: number;
  totalRevenue: number;
  averageStayTime: number;
  averagePrice: number;
  completedTickets: number;
  activeTickets: number;
}

const ParkingReportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ParkingTicket[]>([]);
  const [stats, setStats] = useState<ParkingStats>({
    totalTickets: 0,
    totalRevenue: 0,
    averageStayTime: 0,
    averagePrice: 0,
    completedTickets: 0,
    activeTickets: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterAndCalculateStats();
  }, [tickets, selectedPeriod, startDate, endDate, vehicleTypeFilter]);

  const calculateDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    if (selectedPeriod === 'custom' && startDate && endDate) {
      return {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    switch (selectedPeriod) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'biweekly':
        start.setDate(now.getDate() - 15);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end };
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const dualDB = getDualDB();
      const allTickets = await dualDB.getParkingTickets();
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterAndCalculateStats = () => {
    const { start, end } = calculateDateRange();
    
    let filtered = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.entryTime);
      const inDateRange = ticketDate >= start && ticketDate <= end;
      const matchesVehicleType = vehicleTypeFilter === 'all' || ticket.vehicleType === vehicleTypeFilter;
      return inDateRange && matchesVehicleType;
    });

    setFilteredTickets(filtered);

    // Calcular estadísticas
    const completed = filtered.filter(t => t.status === 'completed');
    const active = filtered.filter(t => t.status === 'active');
    
    const totalRevenue = completed.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const averagePrice = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Calcular tiempo promedio de estadía (en minutos)
    let totalMinutes = 0;
    completed.forEach(ticket => {
      if (ticket.exitTime) {
        const entry = new Date(ticket.entryTime);
        const exit = new Date(ticket.exitTime);
        const diff = (exit.getTime() - entry.getTime()) / (1000 * 60); // minutos
        totalMinutes += diff;
      }
    });
    const averageStayTime = completed.length > 0 ? totalMinutes / completed.length : 0;

    setStats({
      totalTickets: filtered.length,
      totalRevenue,
      averageStayTime,
      averagePrice,
      completedTickets: completed.length,
      activeTickets: active.length
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const calculateStayTime = (entry: Date | string, exit?: Date | string) => {
    const entryDate = new Date(entry);
    const exitDate = exit ? new Date(exit) : new Date();
    const diff = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60);
    return diff;
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'daily': return 'Hoy';
      case 'weekly': return 'Última Semana';
      case 'biweekly': return 'Últimas 2 Semanas';
      case 'monthly': return 'Este Mes';
      case 'custom': return 'Personalizado';
      default: return '';
    }
  };

  const exportToCSV = () => {
    const { start, end } = calculateDateRange();
    const headers = [
      'Fecha',
      'Placa',
      'Tipo Vehículo',
      'Hora Entrada',
      'Hora Salida',
      'Duración',
      'Monto',
      'Estado'
    ];

    const rows = filteredTickets.map(ticket => {
      const stayTime = ticket.exitTime 
        ? calculateStayTime(ticket.entryTime, ticket.exitTime)
        : calculateStayTime(ticket.entryTime);

      return [
        formatDate(ticket.entryTime),
        ticket.placa,
        ticket.vehicleType,
        formatTime(ticket.entryTime),
        ticket.exitTime ? formatTime(ticket.exitTime) : 'En parqueadero',
        formatDuration(stayTime),
        ticket.totalAmount?.toString() || '0',
        ticket.status === 'completed' ? 'Completado' : 'Activo'
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_parqueadero_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Reporte exportado exitosamente');
  };

  const exportDetailedPDF = () => {
    // Esta función podría implementarse con una librería como jsPDF
    toast('Función de exportación PDF disponible próximamente', {
      icon: 'ℹ️',
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Reportes de Parqueadero</h1>
                <p className="text-gray-600">Análisis detallado de entradas, salidas y ganancias</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={exportDetailedPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros de Búsqueda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value as PeriodType);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Hoy</option>
                <option value="weekly">Última Semana</option>
                <option value="biweekly">Últimas 2 Semanas</option>
                <option value="monthly">Este Mes</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Tipo de Vehículo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Vehículo
              </label>
              <select
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="car">Carro</option>
                <option value="motorcycle">Moto</option>
                <option value="truck">Camión</option>
              </select>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPeriod('custom');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={selectedPeriod !== 'custom' && !startDate}
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPeriod('custom');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={selectedPeriod !== 'custom' && !endDate}
              />
            </div>
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        >
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">{getPeriodLabel()}</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-sm opacity-90">Ingresos Totales</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Tickets</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.completedTickets}</h3>
            <p className="text-sm opacity-90">Completados</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Promedio</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatDuration(stats.averageStayTime)}</h3>
            <p className="text-sm opacity-90">Tiempo de Estadía</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Promedio</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(stats.averagePrice)}</h3>
            <p className="text-sm opacity-90">Por Ticket</p>
          </div>
        </motion.div>

        {/* Lista de Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Detalle de Tickets - {getPeriodLabel()}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} encontrado{filteredTickets.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <PieChartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay tickets para el período seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Placa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Salida
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((ticket, index) => {
                    const stayTime = ticket.exitTime
                      ? calculateStayTime(ticket.entryTime, ticket.exitTime)
                      : calculateStayTime(ticket.entryTime);

                    return (
                      <motion.tr
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-800">
                              {formatDate(ticket.entryTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-800">
                            {ticket.placa}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {ticket.vehicleType === 'car' ? '🚗 Carro' : 
                             ticket.vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚛 Camión'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-800">
                              {formatTime(ticket.entryTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ticket.exitTime ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-gray-800">
                                {formatTime(ticket.exitTime)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              En parqueadero
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800">
                            {formatDuration(stayTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(ticket.totalAmount || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {ticket.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              Completado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3" />
                              Activo
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ParkingReportManagement;
