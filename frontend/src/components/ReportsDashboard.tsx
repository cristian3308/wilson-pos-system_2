'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Download, BarChart2, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import { localDB, ParkingTicket, CarwashTransaction, getLocalDB } from '@/lib/localDatabase';
import DateRangePicker, { DateRange as DateRangeFilter, parseLocalDate } from '@/components/DateRangePicker';
import SummaryCards from './SummaryCards';
import RevenueChart from './RevenueChart';
import ParkingReportTable from './ParkingReportTable';
import CarwashReportTable from './CarwashReportTable';
import WorkerCommissionsReport from './WorkerCommissionsReport';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';

type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';
type ChartType = 'bar' | 'line';

interface DateRange {
  start: Date;
  end: Date;
}

const ReportsDashboard: React.FC = () => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('day');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date()
  });
  
  const [parkingTickets, setParkingTickets] = useState<ParkingTicket[]>([]);
  const [carwashTransactions, setCarwashTransactions] = useState<CarwashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el DateRangePicker
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: null,
    to: null,
    filter: 'all'
  });
  const [lastClosureDate, setLastClosureDate] = useState<Date | null>(null);

  // Cargar fecha del último cierre
  useEffect(() => {
    const localDBInstance = getLocalDB();
    const lastClosure = localDBInstance.getLastClosure();
    setLastClosureDate(lastClosure);
    
    if (lastClosure) {
      const hoursSinceLastClosure = (Date.now() - lastClosure.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastClosure < 24) {
        console.log(`📅 [ReportsDashboard] Último cierre hace ${Math.floor(hoursSinceLastClosure)} horas`);
      }
    }
  }, []);

  // 🎧 Escuchar evento de cierre de caja completado
  useEffect(() => {
    const handleCashClosure = (data: { closureDate: Date }) => {
      console.log('📡 [ReportsDashboard] Cierre de caja detectado, actualizando datos...');
      
      // Actualizar la fecha del último cierre
      setLastClosureDate(data.closureDate);
      
      // Aplicar automáticamente el filtro "Desde último cierre"
      setDateRange({
        from: data.closureDate,
        to: new Date(),
        filter: 'lastClosure'
      });
      
      console.log('✅ [ReportsDashboard] Filtro aplicado desde:', data.closureDate.toLocaleString('es-CO'));
    };

    appEvents.on(APP_EVENTS.CASH_CLOSURE_COMPLETED, handleCashClosure);

    return () => {
      appEvents.off(APP_EVENTS.CASH_CLOSURE_COMPLETED, handleCashClosure);
    };
  }, []);

  // Calcular rango de fechas según el filtro
  const getDateRange = (): DateRange => {
    // Priorizar filtro de DateRangePicker si está activo
    if (dateRange.filter !== 'all' && dateRange.from && dateRange.to) {
      return {
        start: new Date(dateRange.from),
        end: new Date(dateRange.to)
      };
    }
    
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (filterPeriod) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        return customDateRange;
    }

    return { start, end };
  };

  // Cargar datos - USAR HISTORIAL REAL igual que el dashboard
  const loadData = async () => {
    setLoading(true);
    try {
      console.log('📊 [ReportsDashboard] Cargando datos...');
      
      // ✅ USAR HISTORIAL REAL en lugar de tickets activos
      const [parkingHistory, allCarwashTransactions] = await Promise.all([
        localDB.getParkingHistory(), // ← Historial completo con TODOS los datos
        localDB.getAllCarwashTransactions()
      ]);
      
      console.log('📊 [ReportsDashboard] Total historial parqueadero:', parkingHistory.length);
      console.log('📊 [ReportsDashboard] Total transacciones lavadero:', allCarwashTransactions.length);
      
      const { start, end } = getDateRange();
      console.log('📊 [ReportsDashboard] Filtrando desde:', start.toLocaleString('es-CO'));
      console.log('📊 [ReportsDashboard] Filtrando hasta:', end.toLocaleString('es-CO'));
      
      // ✅ FILTRAR HISTORIAL igual que el dashboard
      const filteredParking = parkingHistory.filter(record => {
        // Verificar estado completado
        const isCompleted = record.estado === 'Salió' || 
                           record.estado === 'Completado' || 
                           record.estado === 'salio' || 
                           record.estado === 'completado';
        
        if (!isCompleted) return false;
        
        // Extraer fecha de salida (cuando se cobró)
        const possibleFields = ['fechaSalida', 'salida', 'fechaEntrada', 'entrada', 'createdAt', 'timestamp'];
        let recordDate: Date | null = null;
        
        for (const field of possibleFields) {
          const dateValue = (record as any)[field];
          if (dateValue && dateValue !== '-') {
            try {
              const date = new Date(dateValue);
              if (!isNaN(date.getTime())) {
                recordDate = date;
                break;
              }
            } catch {
              continue;
            }
          }
        }
        
        if (!recordDate) return false;
        
        const inRange = recordDate >= start && recordDate <= end;
        
        if (inRange) {
          console.log(`   ✅ Incluido: ${record.placa} - $${record.cobro} - ${recordDate.toLocaleString('es-CO')}`);
        }
        
        return inRange;
      });

      // ✅ Convertir formato de historial a formato de tickets para tablas
      const ticketsForDisplay = filteredParking.map(record => ({
        id: record.id || `history-${Date.now()}`,
        vehicleId: record.placa || '',
        vehicleType: record.vehiculo || record.tipoVehiculo || 'Carro',
        licensePlate: record.placa || '',
        placa: record.placa || '',
        entryTime: new Date(record.fechaEntrada || record.entrada || Date.now()),
        exitTime: new Date(record.fechaSalida || record.salida || Date.now()),
        totalAmount: record.cobro || 0,
        basePrice: record.cobro || 0,
        status: 'completed' as const,
        isPaid: true,
        duration: record.tiempoTotal || 0,
        createdAt: new Date(record.fechaEntrada || Date.now()),
        updatedAt: new Date(record.fechaSalida || Date.now())
      }));

      // ✅ FILTRAR LAVADERO solo transacciones completadas
      const filteredCarwash = allCarwashTransactions.filter(transaction => {
        const isCompleted = transaction.status === 'completed';
        if (!isCompleted) return false;
        
        const transDate = transaction.createdAt || transaction.startTime;
        if (!transDate) return false;
        
        const transactionDate = new Date(transDate);
        const inRange = transactionDate >= start && transactionDate <= end;
        
        if (inRange) {
          console.log(`   ✅ Lavado incluido: ${transaction.placa} - $${transaction.basePrice} - ${transactionDate.toLocaleString('es-CO')}`);
        }
        
        return inRange;
      });

      console.log('📊 [ReportsDashboard] Registros filtrados:');
      console.log('   🚗 Parqueadero:', ticketsForDisplay.length);
      console.log('   🧼 Lavadero:', filteredCarwash.length);

      setParkingTickets(ticketsForDisplay);
      setCarwashTransactions(filteredCarwash);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPeriod, customDateRange, dateRange]);

  // Calcular métricas
  // Calcular métricas - USAR MISMO CÁLCULO QUE EL DASHBOARD
  const calculateMetrics = () => {
    const parkingRevenue = parkingTickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
    // ✅ USAR SOLO basePrice (sin IVA) igual que el dashboard
    const carwashRevenue = carwashTransactions.reduce((sum, transaction) => sum + (transaction.basePrice || 0), 0);
    const totalCommissions = carwashTransactions.reduce((sum, transaction) => sum + (transaction.workerCommission || 0), 0);
    const totalRevenue = parkingRevenue + carwashRevenue;
    const netProfit = totalRevenue - totalCommissions;

    console.log('💰 [ReportsDashboard] Métricas calculadas:');
    console.log('   📍 Parqueadero:', parkingRevenue);
    console.log('   🧼 Lavadero:', carwashRevenue);
    console.log('   👥 Comisiones:', totalCommissions);
    console.log('   💵 Total:', totalRevenue);
    console.log('   ✨ Ganancia Neta:', netProfit);

    return {
      totalRevenue,
      parkingRevenue,
      carwashRevenue,
      totalCommissions,
      netProfit
    };
  };

  // Generar datos para la gráfica
  const generateChartData = () => {
    const { start, end } = getDateRange();
    const data: { date: string; parqueadero: number; lavadero: number }[] = [];

    if (filterPeriod === 'day') {
      // Por horas
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(start);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(start);
        hourEnd.setHours(hour, 59, 59, 999);

        const parkingAmount = parkingTickets
          .filter(t => {
            const time = new Date(t.entryTime);
            return time >= hourStart && time <= hourEnd;
          })
          .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        const carwashAmount = carwashTransactions
          .filter(t => {
            const time = new Date(t.startTime);
            return time >= hourStart && time <= hourEnd;
          })
          .reduce((sum, t) => sum + (t.basePrice || 0), 0);

        data.push({
          date: `${hour}:00`,
          parqueadero: parkingAmount,
          lavadero: carwashAmount
        });
      }
    } else if (filterPeriod === 'week') {
      // Por días de la semana
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(start);
        dayStart.setDate(start.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const parkingAmount = parkingTickets
          .filter(t => {
            const time = new Date(t.entryTime);
            return time >= dayStart && time <= dayEnd;
          })
          .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        const carwashAmount = carwashTransactions
          .filter(t => {
            const time = new Date(t.startTime);
            return time >= dayStart && time <= dayEnd;
          })
          .reduce((sum, t) => sum + (t.basePrice || 0), 0);

        data.push({
          date: days[dayStart.getDay()],
          parqueadero: parkingAmount,
          lavadero: carwashAmount
        });
      }
    } else if (filterPeriod === 'month') {
      // Por semanas del mes
      const weekCount = Math.ceil((end.getDate() - start.getDate() + 1) / 7);
      for (let week = 0; week < weekCount; week++) {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + week * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        if (weekEnd > end) weekEnd.setTime(end.getTime());

        const parkingAmount = parkingTickets
          .filter(t => {
            const time = new Date(t.entryTime);
            return time >= weekStart && time <= weekEnd;
          })
          .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        const carwashAmount = carwashTransactions
          .filter(t => {
            const time = new Date(t.startTime);
            return time >= weekStart && time <= weekEnd;
          })
          .reduce((sum, t) => sum + (t.basePrice || 0), 0);

        data.push({
          date: `Sem ${week + 1}`,
          parqueadero: parkingAmount,
          lavadero: carwashAmount
        });
      }
    } else if (filterPeriod === 'year') {
      // Por meses del año
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(start.getFullYear(), month, 1);
        const monthEnd = new Date(start.getFullYear(), month + 1, 0, 23, 59, 59, 999);

        const parkingAmount = parkingTickets
          .filter(t => {
            const time = new Date(t.entryTime);
            return time >= monthStart && time <= monthEnd;
          })
          .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        const carwashAmount = carwashTransactions
          .filter(t => {
            const time = new Date(t.startTime);
            return time >= monthStart && time <= monthEnd;
          })
          .reduce((sum, t) => sum + (t.basePrice || 0), 0);

        data.push({
          date: months[month],
          parqueadero: parkingAmount,
          lavadero: carwashAmount
        });
      }
    }

    return data;
  };

  const metrics = calculateMetrics();
  const chartData = generateChartData();

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📊 Reportes Financieros</h1>
            <p className="text-blue-200 text-lg">Análisis completo de ingresos y operaciones</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
          {/* Primera fila: Filtros rápidos */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">Filtrar por:</span>
            </div>
            
            {/* Botones de período */}
            <div className="flex gap-2">
              {[
                { value: 'day' as FilterPeriod, label: 'Hoy' },
                { value: 'week' as FilterPeriod, label: 'Semana' },
                { value: 'month' as FilterPeriod, label: 'Mes' },
                { value: 'year' as FilterPeriod, label: 'Año' },
                { value: 'custom' as FilterPeriod, label: 'Personalizado' }
              ].map(period => (
                <button
                  key={period.value}
                  onClick={() => setFilterPeriod(period.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterPeriod === period.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Selector de tipo de gráfica */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg transition-all ${
                  chartType === 'bar'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Gráfica de barras"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg transition-all ${
                  chartType === 'line'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Gráfica de líneas"
              >
                <LineChartIcon className="w-5 h-5" />
              </button>
              
              {/* Botón de Filtrar por Fecha */}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  dateRange.filter !== 'all'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Filtrar por fecha"
              >
                <Calendar className="w-5 h-5" />
                {dateRange.filter !== 'all' ? 'Filtro Activo' : 'Filtrar'}
              </button>
            </div>

            <button
              onClick={loadData}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Segunda fila: Rango personalizado (solo visible si filterPeriod === 'custom') */}
          {filterPeriod === 'custom' && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">Rango personalizado:</span>
              
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-slate-300 text-sm">Desde:</label>
                  <input
                    type="date"
                    value={customDateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setCustomDateRange({
                      ...customDateRange,
                      start: parseLocalDate(e.target.value)
                    })}
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-slate-300 text-sm">Hasta:</label>
                  <input
                    type="date"
                    value={customDateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setCustomDateRange({
                      ...customDateRange,
                      end: parseLocalDate(e.target.value, true)
                    })}
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={loadData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Cargando reportes...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <SummaryCards {...metrics} />

          {/* Gráfica de ingresos */}
          <div className="mb-8">
            <RevenueChart data={chartData} chartType={chartType} />
          </div>

          {/* Tablas de datos */}
          <div className="space-y-8">
            <ParkingReportTable tickets={parkingTickets} />
            <CarwashReportTable transactions={carwashTransactions} />
            <WorkerCommissionsReport transactions={carwashTransactions} />
          </div>
        </>
      )}

      {/* Modal de Filtros de Fecha */}
      {showDateFilter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDateFilter(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Calendar className="w-8 h-8" />
                Filtrar Reportes por Fecha
              </h2>
              <button
                onClick={() => setShowDateFilter(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <DateRangePicker
                onRangeChange={(range) => {
                  setDateRange(range);
                  console.log('📅 [ReportsDashboard] Filtro de fecha seleccionado:', range);
                  
                  // Auto-cerrar el modal si no es filtro personalizado o si ya se seleccionaron ambas fechas
                  if (range.filter !== 'custom' || (range.from && range.to)) {
                    setTimeout(() => setShowDateFilter(false), 300);
                    // Los datos se recargarán automáticamente por el useEffect que escucha dateRange
                  }
                }}
                lastClosureDate={lastClosureDate}
                showQuickFilters={true}
              />
              
              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-600/50 rounded-lg">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Nota:</strong> Los filtros de fecha afectan todos los reportes y gráficas. 
                  Los datos históricos se mantienen guardados y no se eliminan.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsDashboard;
