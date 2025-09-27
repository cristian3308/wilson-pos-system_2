import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

interface LiveMetric {
  id: string;
  value: number;
  label: string;
  unit?: string;
  color: string;
}

interface LiveMetricsProps {
  className?: string;
}

export const LiveMetrics: React.FC<LiveMetricsProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<LiveMetric[]>([
    { id: 'active-spots', value: 0, label: 'Espacios Activos', color: 'text-blue-500' },
    { id: 'queue-carwash', value: 0, label: 'Cola Lavado', color: 'text-green-500' },
    { id: 'employees-online', value: 0, label: 'Empleados En Línea', color: 'text-purple-500' },
    { id: 'daily-revenue', value: 0, label: 'Ingresos Hoy', unit: '$', color: 'text-yellow-500' }
  ]);

  // Simular actualizaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.id === 'daily-revenue' 
          ? Math.floor(Math.random() * 50000) + 25000
          : Math.floor(Math.random() * 20) + 1
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Métricas en Vivo
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Actualizaciones en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center"
          >
            <motion.div
              key={metric.value}
              initial={{ scale: 1.2, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`text-2xl font-bold ${metric.color} mb-1`}
            >
              {metric.unit}{metric.value.toLocaleString()}
            </motion.div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {metric.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-green-500 rounded-full mr-2"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Actualizando cada 3 segundos
        </span>
      </div>
    </Card>
  );
};