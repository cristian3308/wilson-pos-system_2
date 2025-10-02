'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AppHeader({ 
  title = "Dashboard POS", 
  subtitle = "Sistema de punto de venta profesional" 
}: AppHeaderProps) {
  return (
    <div>
      <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
        {subtitle}
      </p>
      
      {/* Connection Status */}
      <div className="flex items-center gap-3 mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full w-fit">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Almacenamiento Local
        </span>
      </div>
    </div>
  );
}