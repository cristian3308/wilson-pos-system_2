import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
  className?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}

const colorClasses = {
  blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  prefix = '',
  suffix = '',
  className = '',
  color = 'blue'
}) => {
  return (
    <Card className={`${className} hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {prefix}{value}{suffix}
            </p>
            {trend && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`ml-2 flex items-center text-sm font-medium ${
                  trend.isPositive 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                <svg
                  className={`w-4 h-4 mr-1 ${
                    trend.isPositive ? 'rotate-0' : 'rotate-180'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {Math.abs(trend.value)}%
              </motion.span>
            )}
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-lg ${colorClasses[color]}`}
        >
          {icon}
        </motion.div>
      </div>
    </Card>
  );
};