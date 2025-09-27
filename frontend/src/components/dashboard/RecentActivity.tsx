import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  ClockIcon, 
  TruckIcon, 
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: 'parking' | 'carwash' | 'payment' | 'service';
  description: string;
  time: string;
  amount?: number;
  status: 'completed' | 'pending' | 'cancelled';
  user?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  className?: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'parking':
      return <TruckIcon className="w-5 h-5" />;
    case 'carwash':
      return <ClockIcon className="w-5 h-5" />;
    case 'payment':
      return <CurrencyDollarIcon className="w-5 h-5" />;
    case 'service':
      return <UserIcon className="w-5 h-5" />;
    default:
      return <ClockIcon className="w-5 h-5" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <ClockIcon className="w-4 h-4 text-yellow-500" />;
    case 'cancelled':
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    default:
      return <ClockIcon className="w-4 h-4 text-gray-500" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'parking':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'carwash':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    case 'payment':
      return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'service':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, className = '' }) => {
  return (
    <Card className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Actividad Reciente
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Últimas transacciones y eventos
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className={`p-2 rounded-lg ${getTypeColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activity.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </p>
                {activity.user && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activity.amount && (
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  ${activity.amount.toLocaleString()}
                </span>
              )}
              {getStatusIcon(activity.status)}
            </div>
          </motion.div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay actividad reciente
          </p>
        </div>
      )}
    </Card>
  );
};