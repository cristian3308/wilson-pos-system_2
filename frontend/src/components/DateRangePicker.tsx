'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, X } from 'lucide-react';

export type DateRangeFilter = 'lastClosure' | 'today' | 'week' | 'month' | 'custom' | 'all';

export interface DateRange {
  from: Date | null;
  to: Date | null;
  filter: DateRangeFilter;
}

interface DateRangePickerProps {
  onRangeChange: (range: DateRange) => void;
  showQuickFilters?: boolean;
  lastClosureDate?: Date | null;
  className?: string;
}

export default function DateRangePicker({
  onRangeChange,
  showQuickFilters = true,
  lastClosureDate = null,
  className = ''
}: DateRangePickerProps) {
  const [selectedFilter, setSelectedFilter] = useState<DateRangeFilter>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Calcular rango de fechas basado en el filtro seleccionado
  const calculateDateRange = (filter: DateRangeFilter): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'lastClosure':
        return {
          from: lastClosureDate || today,
          to: now,
          filter: 'lastClosure'
        };

      case 'today':
        return {
          from: today,
          to: now,
          filter: 'today'
        };

      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Domingo
        return {
          from: weekStart,
          to: now,
          filter: 'week'
        };

      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          from: monthStart,
          to: now,
          filter: 'month'
        };

      case 'custom':
        if (customFrom && customTo) {
          return {
            from: new Date(customFrom),
            to: new Date(customTo + 'T23:59:59'),
            filter: 'custom'
          };
        }
        return { from: null, to: null, filter: 'custom' };

      case 'all':
      default:
        return {
          from: null,
          to: null,
          filter: 'all'
        };
    }
  };

  // Manejar cambio de filtro
  const handleFilterChange = (filter: DateRangeFilter) => {
    setSelectedFilter(filter);
    
    if (filter === 'custom') {
      setShowCustomPicker(true);
      // No emitir cambio hasta que el usuario seleccione fechas
    } else {
      setShowCustomPicker(false);
      const range = calculateDateRange(filter);
      onRangeChange(range);
    }
  };

  // Aplicar rango personalizado
  const applyCustomRange = () => {
    if (customFrom && customTo) {
      const range = calculateDateRange('custom');
      onRangeChange(range);
      setShowCustomPicker(false);
    }
  };

  // Cancelar selección personalizada
  const cancelCustomRange = () => {
    setShowCustomPicker(false);
    setSelectedFilter('all');
    setCustomFrom('');
    setCustomTo('');
    onRangeChange({ from: null, to: null, filter: 'all' });
  };

  // Formatear fecha para mostrar
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Obtener texto descriptivo del filtro actual
  const getFilterDescription = (): string => {
    const range = calculateDateRange(selectedFilter);
    
    if (selectedFilter === 'all') {
      return 'Mostrando todos los datos históricos';
    }
    
    if (selectedFilter === 'custom' && range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    
    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    
    return 'Seleccione un rango de fechas';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Filtrar por Fecha</h3>
            <p className="text-sm text-gray-600">{getFilterDescription()}</p>
          </div>
        </div>
      </div>

      {/* Filtros rápidos */}
      {showQuickFilters && (
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros Rápidos</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Desde último cierre */}
            {lastClosureDate && (
              <button
                onClick={() => handleFilterChange('lastClosure')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                  selectedFilter === 'lastClosure'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-bold">Desde Último Cierre</div>
                    <div className="text-xs opacity-80">
                      {formatDate(lastClosureDate)}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Hoy */}
            <button
              onClick={() => handleFilterChange('today')}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'today'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Hoy</span>
              </div>
            </button>

            {/* Esta semana */}
            <button
              onClick={() => handleFilterChange('week')}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'week'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Esta Semana</span>
              </div>
            </button>

            {/* Este mes */}
            <button
              onClick={() => handleFilterChange('month')}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'month'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Este Mes</span>
              </div>
            </button>

            {/* Personalizado */}
            <button
              onClick={() => handleFilterChange('custom')}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'custom'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Personalizado</span>
              </div>
            </button>

            {/* Todos los datos */}
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedFilter === 'all'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Todos los Datos</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Selector de rango personalizado */}
      {showCustomPicker && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-800">Rango Personalizado</h4>
              <button
                onClick={cancelCustomRange}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={customFrom}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                customFrom && customTo
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-102'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Aplicar Rango Personalizado
            </button>
          </div>
        </div>
      )}

      {/* Indicador visual del filtro activo */}
      {selectedFilter !== 'all' && !showCustomPicker && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-800">
                Filtro Activo
              </span>
            </div>
            <button
              onClick={() => handleFilterChange('all')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Limpiar Filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
