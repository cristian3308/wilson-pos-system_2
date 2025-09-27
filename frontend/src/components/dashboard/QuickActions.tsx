import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { 
  PlusIcon,
  QrCodeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface QuickActionsProps {
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ className = '' }) => {
  const quickActions: QuickAction[] = [
    {
      id: 'new-parking',
      title: 'Nuevo Ticket',
      description: 'Registrar vehículo',
      icon: <TruckIcon className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => console.log('New parking ticket')
    },
    {
      id: 'new-carwash',
      title: 'Servicio Lavado',
      description: 'Nueva orden',
      icon: <WrenchScrewdriverIcon className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => console.log('New carwash service')
    },
    {
      id: 'qr-scanner',
      title: 'Escanear QR',
      description: 'Leer código',
      icon: <QrCodeIcon className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => console.log('QR Scanner')
    },
    {
      id: 'add-employee',
      title: 'Nuevo Empleado',
      description: 'Agregar personal',
      icon: <UserGroupIcon className="w-6 h-6" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => console.log('Add employee')
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Ver estadísticas',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => console.log('View reports')
    },
    {
      id: 'add-service',
      title: 'Nuevo Servicio',
      description: 'Crear servicio',
      icon: <PlusIcon className="w-6 h-6" />,
      color: 'bg-red-500 hover:bg-red-600',
      action: () => console.log('Add service')
    }
  ];

  return (
    <Card className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Acciones Rápidas
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Funciones más utilizadas
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.action}
            className={`
              ${action.color} text-white rounded-lg p-4 text-left
              transition-all duration-200 shadow-sm hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
          >
            <div className="flex flex-col items-start">
              <div className="mb-2">
                {action.icon}
              </div>
              <h4 className="font-medium text-sm mb-1">
                {action.title}
              </h4>
              <p className="text-xs opacity-90">
                {action.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </Card>
  );
};