'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

export type FilterPeriod = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  period: FilterPeriod;
}

interface DateRangeFilterProps {
  onFilterChange: (dateRange: DateRange) => void;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onFilterChange, 
  className = '' 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Generar fechas basadas en el período seleccionado
  const generateDateRange = (period: FilterPeriod): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          period: 'today'
        };
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return {
          startDate: weekStart,
          endDate: weekEnd,
          period: 'week'
        };
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return {
          startDate: monthStart,
          endDate: monthEnd,
          period: 'month'
        };
      
      case 'custom':
        const startDate = customStartDate 
          ? new Date(customStartDate) 
          : today;
        const endDate = customEndDate 
          ? new Date(customEndDate + 'T23:59:59')
          : new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
        return {
          startDate,
          endDate,
          period: 'custom'
        };
      
      default:
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          period: 'today'
        };
    }
  };

  // Manejar cambio de período
  const handlePeriodChange = (period: FilterPeriod) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      const dateRange = generateDateRange(period);
      onFilterChange(dateRange);
    }
  };

  // Manejar cambio de fechas personalizadas
  const handleCustomDateChange = () => {
    if (selectedPeriod === 'custom') {
      const dateRange = generateDateRange('custom');
      onFilterChange(dateRange);
    }
  };

  // Aplicar filtro inicial al montar el componente
  useEffect(() => {
    const initialRange = generateDateRange(selectedPeriod);
    onFilterChange(initialRange);
  }, []);

  // Aplicar filtro cuando cambien las fechas personalizadas
  useEffect(() => {
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      handleCustomDateChange();
    }
  }, [customStartDate, customEndDate]);

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Filter className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Filtros de Fecha</h3>
      </div>

      {/* Selector de período predefinido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => handlePeriodChange('today')}
          className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
            selectedPeriod === 'today'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          🗓️ Hoy
        </button>
        
        <button
          onClick={() => handlePeriodChange('week')}
          className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
            selectedPeriod === 'week'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          📅 Esta Semana
        </button>
        
        <button
          onClick={() => handlePeriodChange('month')}
          className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
            selectedPeriod === 'month'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          🗓️ Este Mes
        </button>
        
        <button
          onClick={() => handlePeriodChange('custom')}
          className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
            selectedPeriod === 'custom'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          📊 Personalizado
        </button>
      </div>

      {/* Selector de fechas personalizado */}
      {selectedPeriod === 'custom' && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Rango Personalizado</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fecha Final
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCustomDateChange}
            className="mt-3 w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Aplicar Filtro</span>
          </button>
        </div>
      )}

      {/* Mostrar rango actual */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Rango Actual: {formatDate(generateDateRange(selectedPeriod).startDate)} - {formatDate(generateDateRange(selectedPeriod).endDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;