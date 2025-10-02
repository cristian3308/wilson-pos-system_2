'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  TruckIcon,
  SparklesIcon,
  CogIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import BusinessConfigurationPanel from '@/components/BusinessConfigurationPanel';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Simular estado de conexión
    setIsConnected(true);
  }, []);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'parqueadero', name: 'Parqueadero', icon: TruckIcon },
    { id: 'lavadero', name: 'Lavadero', icon: SparklesIcon },
    { id: 'admin', name: 'Admin', icon: CogIcon, active: true },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'dashboard') {
      window.location.href = '/dashboard';
    } else if (tabId === 'parqueadero') {
      window.location.href = '/dashboard';
    } else if (tabId === 'lavadero') {
      window.location.href = '/dashboard';
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/30 to-neutral-50 dark:from-neutral-900 dark:via-blue-900/10 dark:to-neutral-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Dashboard POS
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                Sistema de configuración y administración
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
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div variants={itemVariants}>
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.active || activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg">
              <BusinessConfigurationPanel />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}