'use client';

import { useState, useEffect } from 'react';
import { getDualDB } from '../lib/dualDatabase';
import { DateRange } from '../components/DateRangeFilter';

export interface ParkingRecord {
  id: string;
  placa: string;
  vehicleType: 'car' | 'motorcycle' | 'truck';
  entryTime: Date;
  exitTime?: Date;
  totalMinutes?: number;
  totalAmount?: number;
  status: 'active' | 'completed' | 'cancelled';
  isPaid: boolean;
}

export interface CarwashRecord {
  id: string;
  placa: string;
  vehicleType: 'car' | 'motorcycle' | 'truck';
  serviceName: string;
  basePrice: number;
  workerName: string;
  workerPercentage: number;
  workerCommission: number;
  companyEarning: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
}

export interface DailySummary {
  parkingRevenue: number;
  carwashRevenue: number;
  totalRevenue: number;
  parkingTransactions: number;
  carwashTransactions: number;
  totalTransactions: number;
}

export const useHistoryData = () => {
  const [parkingRecords, setParkingRecords] = useState<ParkingRecord[]>([]);
  const [carwashRecords, setCarwashRecords] = useState<CarwashRecord[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    parkingRevenue: 0,
    carwashRevenue: 0,
    totalRevenue: 0,
    parkingTransactions: 0,
    carwashTransactions: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | null>(null);

  // Cargar datos del parqueadero
  const loadParkingRecords = async (dateRange: DateRange) => {
    try {
      const dualDB = getDualDB();
      const allTickets = await dualDB.getParkingTickets();
      
      // Filtrar por rango de fechas
      const filteredTickets = allTickets.filter((ticket: any) => {
        const entryTime = ticket.entryTime;
        return entryTime >= dateRange.startDate && entryTime <= dateRange.endDate;
      });

      // Convertir a formato ParkingRecord
      const records: ParkingRecord[] = filteredTickets.map((ticket: any) => ({
        id: ticket.id,
        placa: ticket.placa,
        vehicleType: ticket.vehicleType,
        entryTime: ticket.entryTime,
        exitTime: ticket.exitTime,
        totalMinutes: ticket.totalMinutes,
        totalAmount: ticket.totalAmount || 0,
        status: ticket.status,
        isPaid: ticket.isPaid
      }));

      setParkingRecords(records);
      return records;
    } catch (error) {
      console.error('Error cargando registros de parqueadero:', error);
      return [];
    }
  };

  // Cargar datos del lavadero
  const loadCarwashRecords = async (dateRange: DateRange) => {
    try {
      const dualDB = getDualDB();
      const allTransactions = await dualDB.getAllCarwashTransactions();
      
      // Filtrar por rango de fechas
      const filteredTransactions = allTransactions.filter(transaction => {
        const startTime = transaction.startTime;
        return startTime >= dateRange.startDate && startTime <= dateRange.endDate;
      });

      // Convertir a formato CarwashRecord
      const records: CarwashRecord[] = filteredTransactions.map(transaction => ({
        id: transaction.id,
        placa: transaction.placa,
        vehicleType: transaction.vehicleType,
        serviceName: transaction.serviceName,
        basePrice: transaction.basePrice,
        workerName: transaction.workerName,
        workerPercentage: transaction.workerPercentage,
        workerCommission: transaction.workerCommission,
        companyEarning: transaction.companyEarning,
        status: transaction.status,
        startTime: transaction.startTime,
        endTime: transaction.endTime
      }));

      setCarwashRecords(records);
      return records;
    } catch (error) {
      console.error('Error cargando registros de lavadero:', error);
      return [];
    }
  };

  // Calcular resumen diario
  const calculateDailySummary = (parkingRecords: ParkingRecord[], carwashRecords: CarwashRecord[]) => {
    const parkingRevenue = parkingRecords
      .filter(record => record.status === 'completed' && record.isPaid)
      .reduce((sum, record) => sum + (record.totalAmount || 0), 0);

    const carwashRevenue = carwashRecords
      .filter(record => record.status === 'completed')
      .reduce((sum, record) => sum + record.companyEarning, 0);

    const summary: DailySummary = {
      parkingRevenue,
      carwashRevenue,
      totalRevenue: parkingRevenue + carwashRevenue,
      parkingTransactions: parkingRecords.filter(record => record.status === 'completed').length,
      carwashTransactions: carwashRecords.filter(record => record.status === 'completed').length,
      totalTransactions: parkingRecords.filter(record => record.status === 'completed').length + 
                        carwashRecords.filter(record => record.status === 'completed').length
    };

    setDailySummary(summary);
  };

  // Cargar todos los datos
  const loadData = async (dateRange: DateRange) => {
    setLoading(true);
    setCurrentDateRange(dateRange);
    
    try {
      const [parkingData, carwashData] = await Promise.all([
        loadParkingRecords(dateRange),
        loadCarwashRecords(dateRange)
      ]);
      
      calculateDailySummary(parkingData, carwashData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar registro de parqueadero
  const deleteParkingRecord = async (recordId: string) => {
    try {
      const dualDB = getDualDB();
      await dualDB.deleteParkingTicket(recordId);
      
      // Recargar datos
      if (currentDateRange) {
        await loadData(currentDateRange);
      }
      
      return { success: true, message: 'Registro eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminando registro de parqueadero:', error);
      return { success: false, message: 'Error eliminando el registro' };
    }
  };

  // Eliminar registro de lavadero
  const deleteCarwashRecord = async (recordId: string) => {
    try {
      const dualDB = getDualDB();
      await dualDB.deleteCarwashTransaction(recordId);
      
      // Recargar datos
      if (currentDateRange) {
        await loadData(currentDateRange);
      }
      
      return { success: true, message: 'Registro eliminado correctamente' };
    } catch (error) {
      console.error('Error eliminando registro de lavadero:', error);
      return { success: false, message: 'Error eliminando el registro' };
    }
  };

  // Actualizar registro de parqueadero
  const updateParkingRecord = async (recordId: string, updates: Partial<ParkingRecord>) => {
    try {
      const dualDB = getDualDB();
      const existingTicket = await dualDB.getParkingTicket(recordId);
      
      if (!existingTicket) {
        return { success: false, message: 'Registro no encontrado' };
      }

      const updatedTicket = {
        ...existingTicket,
        ...updates,
        updatedAt: new Date()
      };

      await dualDB.updateParkingTicket(updatedTicket);
      
      // Recargar datos
      if (currentDateRange) {
        await loadData(currentDateRange);
      }
      
      return { success: true, message: 'Registro actualizado correctamente' };
    } catch (error) {
      console.error('Error actualizando registro de parqueadero:', error);
      return { success: false, message: 'Error actualizando el registro' };
    }
  };

  return {
    parkingRecords,
    carwashRecords,
    dailySummary,
    loading,
    loadData,
    deleteParkingRecord,
    deleteCarwashRecord,
    updateParkingRecord,
    currentDateRange
  };
};