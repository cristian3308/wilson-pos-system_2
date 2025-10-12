// Sistema inteligente de parqueadero con sincronización robusta
import { dualDatabase, ParkingTicket } from './dualDatabase';
import { safeDate, safeGetTime, safeDateDiff, isValidDate } from '../utils/dateUtils';

interface DailyIncome {
  date: string; // YYYY-MM-DD
  totalAmount: number;
  ticketCount: number;
  vehicleTypes: {
    car: { count: number; amount: number };
    motorcycle: { count: number; amount: number };
    truck: { count: number; amount: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

class ParkingSystem {
  private static instance: ParkingSystem;
  
  static getInstance(): ParkingSystem {
    if (!ParkingSystem.instance) {
      ParkingSystem.instance = new ParkingSystem();
    }
    return ParkingSystem.instance;
  }

  // Generar ID único para evitar duplicados
  private generateUniqueId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ticket-${timestamp}-${random}`;
  }

  // Generar barcode único en formato EAN-13
  private generateBarcode(): string {
    const timestamp = Date.now();
    // Usar solo los últimos 12 dígitos del timestamp
    const base = timestamp.toString().slice(-12).padStart(12, '0');
    
    // Calcular check digit EAN-13 estándar
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const weight = (i % 2 === 0) ? 1 : 3;
      sum += parseInt(base[i]) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Retornar EAN-13 completo (13 dígitos)
    const ean13 = base + checkDigit;
    console.log('🔢 EAN-13 generado para ticket:', ean13);
    return ean13;
  }

  // Procesar entrada de vehículo (nueva función completa)
  async processEntry(
    placa: string, 
    vehicleType: string, 
    basePrice: number
  ): Promise<ParkingTicket> {
    
    console.log(`🚗 Procesando entrada: ${placa}, ${vehicleType}, $${basePrice}`);
    
    // Verificar si ya existe un ticket activo para esta placa
    const existingTickets = await dualDatabase.getParkingTickets('active');
    const existingTicket = existingTickets.find(t => 
      t.placa?.toLowerCase() === placa.toLowerCase()
    );
    
    if (existingTicket) {
      console.warn(`⚠️ Ya existe ticket activo para ${placa}:`, existingTicket);
      throw new Error(`Ya existe un ticket activo para la placa ${placa}`);
    }

    const now = new Date();
    const ticketId = this.generateUniqueId();
    const barcode = this.generateBarcode();
    
    console.log('✅ Ticket:', placa.toUpperCase(), '| Barcode:', barcode);
    
    // Ya no mapeamos, usamos el tipo tal cual viene (puede ser 'car', 'motorcycle', 'truck' o un ID personalizado)
    const ticket: ParkingTicket = {
      id: ticketId,
      vehicleId: ticketId,
      placa: placa.toUpperCase(),
      vehicleType: vehicleType, // ✅ Usar el valor tal cual sin mapear
      entryTime: now,
      basePrice: basePrice,
      barcode: barcode,
      status: 'active',
      isPaid: false,
      createdAt: now,
      updatedAt: now
    };

    // Guardar ticket de forma segura
    await this.saveTicketSecure(ticket);
    
    return ticket;
  }

  // Registrar entrada de vehículo
  async registerEntry(
    placa: string, 
    vehicleType: 'car' | 'motorcycle' | 'truck'
  ): Promise<ParkingTicket> {
    
    // Verificar si ya existe un ticket activo para esta placa
    const existingTickets = await dualDatabase.getParkingTickets('active');
    const existingTicket = existingTickets.find(t => 
      t.placa?.toLowerCase() === placa.toLowerCase()
    );
    
    if (existingTicket) {
      throw new Error(`Ya existe un ticket activo para la placa ${placa}`);
    }

    const now = new Date();
    const ticketId = this.generateUniqueId();
    const basePrice = this.getBasePriceByVehicle(vehicleType);
    
    const ticket: ParkingTicket = {
      id: ticketId,
      vehicleId: ticketId, // Usar el mismo ID para vehicleId
      placa: placa.toUpperCase(),
      vehicleType,
      entryTime: now,
      basePrice,
      status: 'active',
      isPaid: false,
      createdAt: now,
      updatedAt: now
    };

    // Guardar ticket de forma segura
    await this.saveTicketSecure(ticket);
    
    console.log(`✅ Vehículo ${placa} registrado correctamente`);
    return ticket;
  }

  // Procesar salida de vehículo
  async processExit(ticketId: string): Promise<ParkingTicket> {
    console.log(`🔍 Buscando ticket para salida con ID: "${ticketId}"`);
    
    // Buscar ticket activo
    const tickets = await dualDatabase.getParkingTickets('active');
    console.log(`📋 Total tickets activos encontrados: ${tickets.length}`);
    
    // Debug: Mostrar todos los IDs disponibles si hay pocos tickets (para no saturar logs)
    if (tickets.length <= 5) {
      tickets.forEach((t, index) => {
        console.log(`🎫 Ticket ${index + 1}: ID="${t.id}", Placa="${t.placa}", Status="${t.status}"`);
      });
    }
    
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
      console.error(`❌ Ticket con ID "${ticketId}" no encontrado entre los tickets activos`);
      if (tickets.length <= 10) {
        console.log('🔍 IDs disponibles:', tickets.map(t => t.id));
      }
      throw new Error('Ticket no encontrado o ya procesado');
    }

    console.log(`✅ Ticket encontrado: ${ticket.placa} (${ticket.id})`);
    const now = new Date();
    
    // Asegurar que entryTime sea un objeto Date válido
    let entryDate: Date;
    if (ticket.entryTime instanceof Date) {
      entryDate = ticket.entryTime;
    } else if (ticket.entryTime && typeof ticket.entryTime === 'object' && 'toDate' in ticket.entryTime) {
      // Firebase Timestamp
      entryDate = (ticket.entryTime as any).toDate();
    } else {
      entryDate = new Date(ticket.entryTime as any);
    }
    
    const timeSpent = this.calculateTimeSpent(entryDate, now);
    const finalAmount = this.calculateFinalAmount(ticket.basePrice, timeSpent);

    // Actualizar ticket a estado COMPLETADO
    const updatedTicket: ParkingTicket = {
      ...ticket,
      entryTime: entryDate, // Asegurar que sea Date
      exitTime: now,
      totalMinutes: timeSpent.totalMinutes,
      totalAmount: finalAmount,
      status: 'completed', // ✅ CRÍTICO: Estado debe ser 'completed'
      isPaid: true,       // ✅ CRÍTICO: Marcado como pagado
      updatedAt: now
    };

    console.log(`🔄 Actualizando ticket ${ticketId} a completado:`, {
      id: updatedTicket.id,
      placa: updatedTicket.placa,
      status: updatedTicket.status,
      isPaid: updatedTicket.isPaid,
      exitTime: updatedTicket.exitTime
    });

    // Actualizar ticket en la base de datos
    await this.updateTicketSecure(updatedTicket);
    
    // Crear registro de actividad reciente
    await this.createActivityRecord(updatedTicket, now, finalAmount, timeSpent);
    
    // Guardar registro de salida en el historial
    const vehicleRecord = {
      id: updatedTicket.id,
      vehiculo: this.getVehicleTypeInSpanish(updatedTicket.vehicleType),
      placa: updatedTicket.placa,
      tipo: 'Por Fracción',
      entrada: entryDate.toLocaleString('es-CO'),
      salida: now.toLocaleString('es-CO'),
      fechaEntrada: entryDate.toISOString(), // ✅ Agregar fecha ISO para filtros
      fechaSalida: now.toISOString(), // ✅ Agregar fecha ISO para filtros
      tiempo: timeSpent.displayTime,
      estado: 'Salió' as const,
      cobro: finalAmount,
      barcode: `WCW${Date.now()}`,
      ticketData: {
        ...updatedTicket,
        fechaEntrada: entryDate,
        fechaSalida: now,
        tiempoTotal: timeSpent.displayTime,
        valorPagar: finalAmount,
        estado: 'pagado'
      }
    };
    
    // Guardar en el historial
    try {
      await dualDatabase.saveParkingRecord(vehicleRecord);
    } catch (error) {
      console.error('❌ Error guardando registro de salida:', error);
    }
    
    // Registrar ingreso del día
    await this.registerDailyIncome(updatedTicket);
    
    console.log(`✅ Salida procesada para ${ticket.placa}: $${finalAmount} (${timeSpent.displayTime})`);
    return updatedTicket;
  }

  // Crear registro de actividad reciente con formato correcto
  private async createActivityRecord(ticket: ParkingTicket, exitTime: Date, finalAmount: number, timeSpent: any): Promise<void> {
    try {
      // Crear registro para actividad reciente
      const activityRecord = {
        id: `activity_${ticket.id}_${Date.now()}`,
        type: 'parking_exit',
        title: `Vehículo salió - ${ticket.placa}`,
        description: `${this.getVehicleTypeInSpanish(ticket.vehicleType)} salió del parqueadero`,
        amount: finalAmount,
        vehicleData: {
          placa: ticket.placa,
          vehicleType: this.getVehicleTypeInSpanish(ticket.vehicleType),
          entryTime: ticket.entryTime,
          exitTime: exitTime,
          timeSpent: timeSpent.displayTime,
          amount: finalAmount
        },
        timestamp: exitTime,
        createdAt: exitTime
      };

      // Guardar en actividad reciente (necesitamos crear este método en dualDatabase)
      console.log(`📋 Registro de actividad creado para ${ticket.placa}:`, activityRecord);
      
    } catch (error) {
      console.error('❌ Error creando registro de actividad:', error);
    }
  }

  // Guardar ticket con validación de duplicados
  private async saveTicketSecure(ticket: ParkingTicket): Promise<void> {
    try {
      // Verificar duplicados por placa activa
      const activeTickets = await dualDatabase.getParkingTickets('active');
      const duplicateTicket = activeTickets.find(t => 
        t.placa === ticket.placa && t.status === 'active'
      );
      
      if (duplicateTicket) {
        console.warn(`⚠️  Ticket activo ya existe para ${ticket.placa}`);
        throw new Error(`Ya existe un ticket activo para ${ticket.placa}`);
      }

      // Guardar en sistema dual
      await dualDatabase.saveParkingTicket(ticket);
      
    } catch (error) {
      console.error('❌ Error guardando ticket:', error);
      throw error;
    }
  }

  // Actualizar ticket con validación
  private async updateTicketSecure(ticket: ParkingTicket): Promise<void> {
    try {
      // SOLUCIÓN: Usar directamente completeParkingTicket para evitar duplicados
      console.log(`🔄 Completando ticket directamente: ${ticket.id} (${ticket.placa})`);
      
      const completedTicket = await dualDatabase.completeParkingTicket(ticket.id, ticket.exitTime);
      console.log(`✅ Ticket completado sin duplicados:`, {
        id: completedTicket.id,
        placa: completedTicket.placa,
        status: completedTicket.status,
        isPaid: completedTicket.isPaid
      });
      
      // Limpiar inmediatamente cualquier ticket activo duplicado para esta placa
      await this.cleanupActiveTicketsForPlate(ticket.placa, ticket.id);
      
    } catch (error) {
      console.error('❌ Error actualizando ticket:', error);
      throw error;
    }
  }

  // Limpiar tickets activos duplicados para una placa específica
  private async cleanupActiveTicketsForPlate(placa: string, keepTicketId: string): Promise<void> {
    try {
      const allTickets = await dualDatabase.getParkingTickets();
      const duplicateActiveTickets = allTickets.filter(t => 
        t.placa === placa && 
        t.status === 'active' && 
        t.id !== keepTicketId
      );
      
      if (duplicateActiveTickets.length > 0) {
        console.log(`🧹 Limpiando ${duplicateActiveTickets.length} tickets activos duplicados para ${placa}`);
        
        for (const duplicate of duplicateActiveTickets) {
          try {
            await dualDatabase.completeParkingTicket(duplicate.id);
            console.log(`✅ Duplicado completado: ${duplicate.id}`);
          } catch (error) {
            console.warn(`⚠️ Error completando duplicado ${duplicate.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error limpiando duplicados para placa:', error);
    }
  }

  // Registrar ingreso diario
  private async registerDailyIncome(ticket: ParkingTicket): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // Obtener ingreso diario existente o crear nuevo
      let dailyIncome = await this.getDailyIncome(today);
      
      if (!dailyIncome) {
        dailyIncome = {
          date: today,
          totalAmount: 0,
          ticketCount: 0,
          vehicleTypes: {
            car: { count: 0, amount: 0 },
            motorcycle: { count: 0, amount: 0 },
            truck: { count: 0, amount: 0 }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Actualizar totales
      dailyIncome.totalAmount += ticket.totalAmount || 0;
      dailyIncome.ticketCount += 1;
      
      // Solo actualizar estadísticas por tipo si es un tipo predeterminado
      if (ticket.vehicleType === 'car' || ticket.vehicleType === 'motorcycle' || ticket.vehicleType === 'truck') {
        dailyIncome.vehicleTypes[ticket.vehicleType as 'car' | 'motorcycle' | 'truck'].count += 1;
        dailyIncome.vehicleTypes[ticket.vehicleType as 'car' | 'motorcycle' | 'truck'].amount += ticket.totalAmount || 0;
      }
      
      dailyIncome.updatedAt = new Date();

      // Guardar ingreso actualizado
      await this.saveDailyIncome(dailyIncome);
      
    } catch (error) {
      console.error('❌ Error registrando ingreso diario:', error);
    }
  }

  // Calcular tiempo transcurrido
  private calculateTimeSpent(entryTime: Date | any, exitTime: Date): {
    hours: number;
    minutes: number;
    totalMinutes: number;
    displayTime: string;
  } {
    // Convertir entryTime a Date si no lo es
    let entryDate: Date;
    if (entryTime instanceof Date) {
      entryDate = entryTime;
    } else if (entryTime && typeof entryTime === 'object' && 'toDate' in entryTime) {
      // Firebase Timestamp
      entryDate = (entryTime as any).toDate();
    } else if (typeof entryTime === 'string') {
      entryDate = new Date(entryTime);
    } else if (typeof entryTime === 'number') {
      entryDate = new Date(entryTime);
    } else {
      console.error('❌ Tipo de entryTime no válido:', entryTime);
      entryDate = new Date(); // Fallback
    }
    
    const diffMs = exitTime.getTime() - entryDate.getTime();
    const totalMinutes = Math.ceil(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const displayTime = hours > 0 
      ? `${hours}h ${minutes}min`
      : `${minutes}min`;

    return {
      hours,
      minutes,
      totalMinutes,
      displayTime
    };
  }

  // Calcular monto final basado en tiempo - Sistema de MEDIAS HORAS
  private calculateFinalAmount(basePrice: number, timeSpent: any): number {
    const hourlyRate = basePrice; // Precio por hora (ej: $2000/hora)
    const totalMinutes = timeSpent.totalMinutes;
    
    // Calcular horas completas y minutos restantes
    const fullHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    // Calcular costo
    let totalCost = 0;
    
    // Cobrar las horas completas
    totalCost += fullHours * hourlyRate;
    
    // Cobrar la fracción restante
    if (remainingMinutes > 0) {
      if (remainingMinutes <= 29) {
        // 1-29 minutos = mitad del precio (media hora)
        totalCost += hourlyRate / 2;
      } else {
        // 30-60 minutos = precio completo (hora completa)
        totalCost += hourlyRate;
      }
    }
    
    // Mínimo cobro: media hora
    return totalCost > 0 ? totalCost : (hourlyRate / 2);
  }  // Convertir tipo de vehículo a español
  private getVehicleTypeInSpanish(vehicleType: string): string {
    const types = {
      car: 'Carro',
      motorcycle: 'Moto', 
      truck: 'Camión'
    };
    return types[vehicleType as keyof typeof types] || vehicleType;
  }

  // Obtener precio base por tipo de vehículo
  private getBasePriceByVehicle(vehicleType: string): number {
    const prices = {
      car: 3000,
      motorcycle: 2000,
      truck: 4000
    };
    return prices[vehicleType as keyof typeof prices] || 3000;
  }

  // Obtener ingreso diario
  private async getDailyIncome(date: string): Promise<DailyIncome | null> {
    // TODO: Implementar obtención de ingreso diario desde la base de datos
    return null;
  }

  // Guardar ingreso diario
  private async saveDailyIncome(income: DailyIncome): Promise<void> {
    // TODO: Implementar guardado de ingreso diario
    console.log('💰 Guardando ingreso diario:', income.totalAmount);
  }

  // Obtener tickets activos sin duplicados
  async getActiveTickets(): Promise<ParkingTicket[]> {
    const tickets = await dualDatabase.getParkingTickets('active');
    
    // Filtrar SOLO tickets realmente activos (no completados, no pagados, sin exitTime)
    const reallyActiveTickets = tickets.filter(ticket => 
      ticket.status === 'active' && 
      !ticket.exitTime && 
      !ticket.isPaid &&
      ticket.entryTime // Debe tener fecha de entrada
    );
    
    // Eliminar duplicados por placa
    const uniqueTickets = reallyActiveTickets.filter((ticket, index, array) => 
      index === array.findIndex(t => t.placa === ticket.placa)
    );
    
    // console.log(`🎯 Tickets activos filtrados: ${tickets.length} -> ${reallyActiveTickets.length} -> ${uniqueTickets.length} únicos`);
    return uniqueTickets;
  }

  // Obtener historial de tickets
  async getTicketHistory(): Promise<ParkingTicket[]> {
    return await dualDatabase.getParkingTickets();
  }

  // Forzar limpieza de tickets completados
  async forceCleanCompletedTickets(): Promise<void> {
    try {
      // Obtener todos los tickets
      const allTickets = await dualDatabase.getParkingTickets();
      
      // Identificar tickets que deberían estar completados
      const completedTickets = allTickets.filter(ticket => 
        ticket.exitTime || 
        ticket.isPaid || 
        ticket.status === 'completed'
      );

      // console.log(`🧹 Limpiando ${completedTickets.length} tickets completados...`);

      // Forzar actualización de cada ticket completado
      for (const ticket of completedTickets) {
        if (ticket.status !== 'completed' || !ticket.isPaid) {
          const updatedTicket = {
            ...ticket,
            status: 'completed' as const,
            isPaid: true,
            updatedAt: new Date()
          };
          
          await dualDatabase.updateParkingTicket(updatedTicket);
          console.log(`✅ Forzado completado: ${ticket.placa}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error en limpieza forzada:', error);
    }
  }

  // Forzar actualización de ticket a completado y eliminar duplicados
  async forceTicketCompletion(ticketId: string): Promise<void> {
    try {
      // Buscar ticket en todas las fuentes
      const allTickets = await dualDatabase.getParkingTickets();
      const ticket = allTickets.find(t => t.id === ticketId);
      
      if (ticket) {
        // Buscar todos los tickets de la misma placa
        const duplicates = allTickets.filter(t => 
          t.placa === ticket.placa && 
          t.id !== ticketId && 
          t.status === 'active'
        );
        
        if (duplicates.length > 0) {
          console.log(`🧹 Encontrados ${duplicates.length} duplicados activos para ${ticket.placa}, eliminando...`);
          
          // Completar todos los duplicados activos
          for (const dup of duplicates) {
            try {
              await dualDatabase.completeParkingTicket(dup.id);
              console.log(`✅ Duplicado completado: ${dup.id}`);
            } catch (error) {
              console.warn(`⚠️ Error completando duplicado ${dup.id}:`, error);
            }
          }
        }
        
        console.log(`🔄 Ticket ${ticketId} forzado a completado`);
      }
    } catch (error) {
      console.error(`❌ Error forzando completado del ticket ${ticketId}:`, error);
    }
  }

  // Obtener ingresos diarios del parqueadero
  async getDailyParkingRevenue(date?: string): Promise<{
    date: string;
    totalRevenue: number;
    vehicleCount: number;
    averageAmount: number;
    vehicleBreakdown: { [key: string]: { count: number; revenue: number } };
  }> {
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    try {
      // Obtener historial de parqueadero del día específico
      const historyRecords = await dualDatabase.getParkingHistory();
      
      // Filtrar registros del día que estén completados/pagados
      const dailyRecords = historyRecords.filter(record => {
        const recordDate = this.extractDateFromRecord(record);
        return recordDate === targetDate && (
          record.estado === 'Salió' || 
          record.estado === 'Completado' || 
          record.estado === 'salio' || 
          record.estado === 'completado'
        );
      });

      // Calcular métricas
      const totalRevenue = dailyRecords.reduce((sum, record) => sum + (record.cobro || 0), 0);
      const vehicleCount = dailyRecords.length;
      const averageAmount = vehicleCount > 0 ? totalRevenue / vehicleCount : 0;

      // Breakdown por tipo de vehículo
      const vehicleBreakdown: { [key: string]: { count: number; revenue: number } } = {};
      
      dailyRecords.forEach(record => {
        const vehicleType = record.vehiculo || record.vehicleType || 'Carro';
        if (!vehicleBreakdown[vehicleType]) {
          vehicleBreakdown[vehicleType] = { count: 0, revenue: 0 };
        }
        vehicleBreakdown[vehicleType].count++;
        vehicleBreakdown[vehicleType].revenue += (record.cobro || 0);
      });

      // console.log(`💰 Ingresos diarios ${targetDate}: $${totalRevenue.toLocaleString()} (${vehicleCount} vehículos)`);

      return {
        date: targetDate,
        totalRevenue,
        vehicleCount,
        averageAmount,
        vehicleBreakdown
      };

    } catch (error) {
      console.error('❌ Error calculando ingresos diarios:', error);
      return {
        date: targetDate,
        totalRevenue: 0,
        vehicleCount: 0,
        averageAmount: 0,
        vehicleBreakdown: {}
      };
    }
  }

  // Extraer fecha de registro de manera robusta
  private extractDateFromRecord(record: any): string {
    // Intentar diferentes campos de fecha
    const possibleFields = ['fechaSalida', 'salida', 'fechaEntrada', 'entrada', 'createdAt', 'timestamp'];
    
    for (const field of possibleFields) {
      const dateValue = record[field];
      if (dateValue && dateValue !== '-') {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch {
          continue;
        }
      }
    }
    
    // Fallback a hoy si no se puede determinar la fecha
    return new Date().toISOString().split('T')[0];
  }

  // Debug: Verificar estado de tickets
  async debugTicketStatus(): Promise<void> {
    try {
      const allTickets = await dualDatabase.getParkingTickets();
      // console.log('🔍 DEBUG - Estado de todos los tickets:');
      
      // allTickets.forEach((ticket, index) => {
      //   console.log(`${index + 1}. ${ticket.placa} - Status: ${ticket.status} - Paid: ${ticket.isPaid} - Exit: ${ticket.exitTime ? 'SÍ' : 'NO'}`);
      // });
      
      const activeTickets = await this.getActiveTickets();
      // console.log(`📋 Total tickets en DB: ${allTickets.length}, Activos filtrados: ${activeTickets.length}`);
      
    } catch (error) {
      console.error('❌ Error en debug:', error);
    }
  }

  // Limpiar duplicados existentes
  async cleanupDuplicates(): Promise<void> {
    try {
      const allTickets = await dualDatabase.getParkingTickets();
      const duplicateGroups = new Map<string, ParkingTicket[]>();
      
      // Agrupar por placa
      allTickets.forEach(ticket => {
        const key = `${ticket.placa}_${ticket.status}`;
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push(ticket);
      });
      
      // Eliminar duplicados (mantener el más reciente)
      duplicateGroups.forEach((group: ParkingTicket[], key: string) => {
        if (group.length > 1) {
          // Ordenar por fecha de creación y mantener el más reciente
          group.sort((a: ParkingTicket, b: ParkingTicket) => {
            // Usar utilidades de fecha segura
            const timeA = safeGetTime(a.createdAt, 0);
            const timeB = safeGetTime(b.createdAt, 0);
            
            return timeB - timeA;
          });
          const toDelete = group.slice(1); // Todos excepto el primero (más reciente)
          
          for (const duplicate of toDelete) {
            // TODO: Implementar eliminación de duplicados
            console.log(`🗑️ Eliminando duplicado: ${duplicate.id} - ${duplicate.placa}`);
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error limpiando duplicados:', error);
    }
  }
}

// Exportar instancia singleton
export const parkingSystem = ParkingSystem.getInstance();
export type { DailyIncome };