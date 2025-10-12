'use client';

import React from 'react';
import { CarwashTransaction } from '@/lib/localDatabase';
import { Users, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkerCommissionsReportProps {
  transactions: CarwashTransaction[];
}

interface WorkerStats {
  name: string;
  servicesCount: number;
  totalCommission: number;
  averageCommission: number;
  percentage: number;
}

const WorkerCommissionsReport: React.FC<WorkerCommissionsReportProps> = ({ transactions }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calcular estadísticas por trabajador
  const calculateWorkerStats = (): WorkerStats[] => {
    const workerMap = new Map<string, WorkerStats>();

    transactions.forEach(transaction => {
      const workerId = transaction.workerId;
      
      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          name: transaction.workerName,
          servicesCount: 0,
          totalCommission: 0,
          averageCommission: 0,
          percentage: transaction.workerPercentage
        });
      }

      const stats = workerMap.get(workerId)!;
      stats.servicesCount++;
      stats.totalCommission += transaction.workerCommission;
    });

    // Calcular promedios
    const workers: WorkerStats[] = Array.from(workerMap.values()).map(worker => ({
      ...worker,
      averageCommission: worker.totalCommission / worker.servicesCount
    }));

    // Ordenar por total de comisiones (descendente)
    return workers.sort((a, b) => b.totalCommission - a.totalCommission);
  };

  const workers = calculateWorkerStats();
  const totalCommissions = workers.reduce((sum, worker) => sum + worker.totalCommission, 0);
  const totalServices = workers.reduce((sum, worker) => sum + worker.servicesCount, 0);

  const getTopPerformer = () => {
    if (workers.length === 0) return null;
    return workers[0];
  };

  const topPerformer = getTopPerformer();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-2xl"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">👨‍🔧 Comisiones de Trabajadores</h3>
        <p className="text-slate-400">{workers.length} trabajadores activos</p>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-300 text-sm">Total Servicios</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalServices}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-300 text-sm">Total Comisiones</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCommissions)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-300 text-sm">Promedio por Servicio</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(totalServices > 0 ? totalCommissions / totalServices : 0)}
          </p>
        </div>
      </div>

      {/* Mejor trabajador */}
      {topPerformer && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-full">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-400 text-sm font-medium uppercase tracking-wider mb-1">
                ⭐ Mejor Desempeño
              </p>
              <p className="text-white text-xl font-bold">{topPerformer.name}</p>
              <p className="text-slate-300 text-sm">
                {topPerformer.servicesCount} servicios • {formatCurrency(topPerformer.totalCommission)} en comisiones
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de trabajadores */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-4 px-4 text-slate-300 font-semibold">
                Trabajador
              </th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">
                Servicios
              </th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">
                % Comisión
              </th>
              <th className="text-right py-4 px-4 text-slate-300 font-semibold">
                Total Comisiones
              </th>
              <th className="text-right py-4 px-4 text-slate-300 font-semibold">
                Promedio
              </th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, index) => (
              <motion.tr
                key={worker.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {index === 0 && <Award className="w-5 h-5 text-yellow-400" />}
                    <span className="text-white font-semibold">{worker.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                    {worker.servicesCount}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-slate-300 font-medium">{worker.percentage}%</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-orange-400 font-bold text-lg">
                    {formatCurrency(worker.totalCommission)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-300 font-medium">
                    {formatCurrency(worker.averageCommission)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {workers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No hay datos de trabajadores en el período seleccionado</p>
        </div>
      )}
    </motion.div>
  );
};

export default WorkerCommissionsReport;
