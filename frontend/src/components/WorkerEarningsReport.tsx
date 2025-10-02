'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  User,
  Download,
  Filter,
  Clock,
  Wallet,
  ChevronDown,
  ChevronUp,
  BarChart3,
  PieChart
} from 'lucide-react';
import { getDualDB, Worker, CarwashTransaction } from '@/lib/dualDatabase';
import toast from 'react-hot-toast';

type PeriodType = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface WorkerEarnings {
  worker: Worker;
  totalEarnings: number;
  totalServices: number;
  averagePerService: number;
  transactions: CarwashTransaction[];
}

const WorkerEarningsReport: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [earnings, setEarnings] = useState<WorkerEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);

  useEffect(() => {
    loadWorkersAndEarnings();
  }, [selectedPeriod, selectedWorkerId, startDate, endDate]);

  const calculateDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    if (startDate && endDate) {
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

  const loadWorkersAndEarnings = async () => {
    try {
      setLoading(true);
      const dualDB = getDualDB();
      
      // Cargar trabajadores
      const allWorkers = await dualDB.getAllWorkers(true);
      setWorkers(allWorkers);

      // Cargar transacciones de lavadero
      const allTransactions = await dualDB.getAllCarwashTransactions();
      
      // Filtrar por rango de fechas
      const { start, end } = calculateDateRange();
      const filteredTransactions = allTransactions.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= start && txDate <= end && t.status === 'completed';
      });

      // Calcular ganancias por trabajador
      const earningsMap = new Map<string, WorkerEarnings>();

      allWorkers.forEach(worker => {
        const workerTransactions = filteredTransactions.filter(
          t => t.workerId === worker.id
        );

        const totalEarnings = workerTransactions.reduce(
          (sum, t) => sum + t.workerCommission, 
          0
        );

        earningsMap.set(worker.id, {
          worker,
          totalEarnings,
          totalServices: workerTransactions.length,
          averagePerService: workerTransactions.length > 0 
            ? totalEarnings / workerTransactions.length 
            : 0,
          transactions: workerTransactions
        });
      });

      // Filtrar por trabajador seleccionado
      let earningsArray = Array.from(earningsMap.values());
      if (selectedWorkerId !== 'all') {
        earningsArray = earningsArray.filter(e => e.worker.id === selectedWorkerId);
      }

      // Ordenar por ganancias totales
      earningsArray.sort((a, b) => b.totalEarnings - a.totalEarnings);

      setEarnings(earningsArray);
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Error al cargar las ganancias');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'daily': return 'Hoy';
      case 'weekly': return 'Última Semana';
      case 'biweekly': return 'Últimas 2 Semanas';
      case 'monthly': return 'Este Mes';
      default: return '';
    }
  };

  const exportToCSV = () => {
    const { start, end } = calculateDateRange();
    const headers = ['Trabajador', 'Total Ganado', 'Servicios', 'Promedio por Servicio'];
    const rows = earnings.map(e => [
      e.worker.name,
      e.totalEarnings.toString(),
      e.totalServices.toString(),
      e.averagePerService.toFixed(2)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ganancias_trabajadores_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Reporte exportado exitosamente');
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.totalEarnings, 0);
  const totalServices = earnings.reduce((sum, e) => sum + e.totalServices, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Ganancias del Personal</h1>
                <p className="text-gray-600">Consulta las comisiones y rendimiento de cada trabajador</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
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
            <h2 className="text-lg font-semibold text-gray-800">Filtros</h2>
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
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Hoy</option>
                <option value="weekly">Última Semana</option>
                <option value="biweekly">Últimas 2 Semanas</option>
                <option value="monthly">Este Mes</option>
              </select>
            </div>

            {/* Trabajador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trabajador
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
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
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </motion.div>

        {/* Resumen General */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">{getPeriodLabel()}</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(totalEarnings)}</h3>
            <p className="text-sm opacity-90">Total Ganado</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Servicios</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{totalServices}</h3>
            <p className="text-sm opacity-90">Total Completados</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Promedio</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">
              {formatCurrency(totalServices > 0 ? totalEarnings / totalServices : 0)}
            </h3>
            <p className="text-sm opacity-90">Por Servicio</p>
          </div>
        </motion.div>

        {/* Lista de Trabajadores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              Detalle por Trabajador
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          ) : earnings.length === 0 ? (
            <div className="p-12 text-center">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay datos para el período seleccionado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {earnings.map((earning, index) => (
                <motion.div
                  key={earning.worker.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <div
                    onClick={() => setExpandedWorker(
                      expandedWorker === earning.worker.id ? null : earning.worker.id
                    )}
                    className="p-6 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {earning.worker.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {earning.worker.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {earning.worker.percentage}% de comisión por servicio
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(earning.totalEarnings)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {earning.totalServices} servicio{earning.totalServices !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {expandedWorker === earning.worker.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  <AnimatePresence>
                    {expandedWorker === earning.worker.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-gray-50"
                      >
                        <div className="px-6 pb-6">
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              Historial de Servicios
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {earning.transactions.map((tx, txIndex) => (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">
                                      {tx.serviceName} - {tx.placa}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(tx.createdAt).toLocaleString('es-CO', {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                      })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-green-600">
                                      {formatCurrency(tx.workerCommission)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      De {formatCurrency(tx.basePrice)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WorkerEarningsReport;
