// Sistema de base de datos local: Solo IndexedDB (sin Firebase)
import { openDB, IDBPDatabase } from 'idb';
import { safeDate, safeGetTime, safeDateDiff, isValidDate } from '../utils/dateUtils';

// Tipos de datos
export interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  percentage: number; // Porcentaje que se lleva del servicio
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarwashService {
  id: string;
  vehicleType: string;
  serviceName: string;
  basePrice: number;
  estimatedTime: number; // en minutos
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarwashTransaction {
  id: string;
  ticketId: string;
  placa: string;
  vehicleType: string;
  serviceName: string;
  basePrice: number;
  workerId: string;
  workerName: string;
  workerPercentage: number;
  workerCommission: number;
  companyEarning: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  placa: string;
  tipo: 'car' | 'motorcycle' | 'truck';
  color?: string;
  modelo?: string;
  propietario?: string;
  telefono?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingTicket {
  id: string;
  vehicleId: string;
  placa: string;
  vehicleType: string; // ✅ Ahora acepta cualquier string (tipos predeterminados o IDs personalizados)
  entryTime: Date;
  exitTime?: Date;
  totalMinutes?: number;
  basePrice: number;
  totalAmount?: number;
  barcode?: string; // Código de barras del ticket
  isPaid: boolean;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleTypeConfig {
  id: string;
  name: string;
  iconName: string;
  tarifa: number;
  isCustom: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BusinessConfig {
  id: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  carParkingRate: number;
  motorcycleParkingRate: number;
  truckParkingRate: number;
  carwashEnabled: boolean;
  parkingEnabled: boolean;
  // Nuevos campos para tipos de vehículos dinámicos
  vehicleTypes: VehicleTypeConfig[];
  // Nuevos campos para configuración de tickets
  ticketData: {
    companyName: string;
    companySubtitle: string;
    nit: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    footerMessage: string;
    footerInfo: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Clase principal para manejo de base de datos local
class LocalDatabase {
  private db!: IDBPDatabase;
  private isInitialized = false;
  private dbName = 'POSLocalDatabase';
  private version = 1;

  // Inicializar IndexedDB
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          // Store para vehículos
          if (!db.objectStoreNames.contains('vehicles')) {
            const vehicleStore = db.createObjectStore('vehicles', { keyPath: 'id' });
            vehicleStore.createIndex('placa', 'placa', { unique: false });
          }

          // Store para tickets de parqueadero
          if (!db.objectStoreNames.contains('parking_tickets')) {
            const parkingStore = db.createObjectStore('parking_tickets', { keyPath: 'id' });
            parkingStore.createIndex('placa', 'placa', { unique: false });
            parkingStore.createIndex('status', 'status', { unique: false });
            parkingStore.createIndex('entryTime', 'entryTime', { unique: false });
          }

          // Store para trabajadores
          if (!db.objectStoreNames.contains('workers')) {
            const workerStore = db.createObjectStore('workers', { keyPath: 'id' });
            workerStore.createIndex('name', 'name', { unique: false });
            workerStore.createIndex('isActive', 'isActive', { unique: false });
          }

          // Store para servicios de lavadero
          if (!db.objectStoreNames.contains('carwash_services')) {
            const serviceStore = db.createObjectStore('carwash_services', { keyPath: 'id' });
            serviceStore.createIndex('vehicleType', 'vehicleType', { unique: false });
            serviceStore.createIndex('isActive', 'isActive', { unique: false });
          }

          // Store para transacciones de lavadero
          if (!db.objectStoreNames.contains('carwash_transactions')) {
            const transactionStore = db.createObjectStore('carwash_transactions', { keyPath: 'id' });
            transactionStore.createIndex('placa', 'placa', { unique: false });
            transactionStore.createIndex('status', 'status', { unique: false });
            transactionStore.createIndex('workerId', 'workerId', { unique: false });
            transactionStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Store para configuración del negocio
          if (!db.objectStoreNames.contains('business_config')) {
            db.createObjectStore('business_config', { keyPath: 'id' });
          }

          // Store para historial de vehículos (reportes)
          if (!db.objectStoreNames.contains('vehicle_history')) {
            const historyStore = db.createObjectStore('vehicle_history', { keyPath: 'id' });
            historyStore.createIndex('placa', 'placa', { unique: false });
            historyStore.createIndex('fecha', 'fecha', { unique: false });
            historyStore.createIndex('tipo', 'tipo', { unique: false });
          }
        },
      });

      this.isInitialized = true;
      console.log('✅ LocalDatabase inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando LocalDatabase:', error);
      throw error;
    }
  }

  // === MÉTODOS PARA VEHÍCULOS ===
  async saveVehicle(vehicle: Vehicle): Promise<void> {
    await this.init();
    await this.db.put('vehicles', vehicle);
    console.log(`✅ Vehículo guardado localmente: ${vehicle.placa}`);
  }

  async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    await this.init();
    return (await this.db.get('vehicles', vehicleId)) || null;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    await this.init();
    return await this.db.getAll('vehicles');
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    await this.init();
    vehicle.updatedAt = new Date();
    await this.db.put('vehicles', vehicle);
    console.log(`✅ Vehículo actualizado localmente: ${vehicle.placa}`);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    await this.init();
    await this.db.delete('vehicles', vehicleId);
    console.log(`✅ Vehículo eliminado localmente: ${vehicleId}`);
  }

  // === MÉTODOS PARA TICKETS DE PARQUEADERO ===
  async saveParkingTicket(ticket: ParkingTicket): Promise<void> {
    await this.init();
    await this.db.put('parking_tickets', ticket);
    console.log(`✅ Ticket de parqueadero guardado localmente: ${ticket.placa}`);
  }

  async getParkingTicket(ticketId: string): Promise<ParkingTicket | null> {
    await this.init();
    return (await this.db.get('parking_tickets', ticketId)) || null;
  }

  async getParkingTickets(status?: 'active' | 'completed' | 'cancelled'): Promise<ParkingTicket[]> {
    await this.init();
    
    if (status) {
      const tx = this.db.transaction('parking_tickets', 'readonly');
      const index = tx.store.index('status');
      return await index.getAll(status);
    }
    
    return await this.db.getAll('parking_tickets');
  }

  async updateParkingTicket(ticket: ParkingTicket): Promise<void> {
    await this.init();
    ticket.updatedAt = new Date();
    await this.db.put('parking_tickets', ticket);
    console.log(`✅ Ticket de parqueadero actualizado localmente: ${ticket.placa}`);
  }

  async completeParkingTicket(ticketId: string, exitTime?: Date): Promise<ParkingTicket> {
    await this.init();
    
    const ticket = await this.getParkingTicket(ticketId);
    if (!ticket) {
      throw new Error(`Ticket no encontrado: ${ticketId}`);
    }

    const exit = exitTime || new Date();
    const entry = new Date(ticket.entryTime);
    const totalMinutes = Math.max(1, Math.floor((exit.getTime() - entry.getTime()) / (1000 * 60)));
    
    // Calcular el monto total basado en el precio base y tiempo
    // Si ya tiene totalAmount, usarlo, sino calcular
    const totalAmount = ticket.totalAmount || ticket.basePrice;

    const updatedTicket: ParkingTicket = {
      ...ticket,
      exitTime: exit,
      totalMinutes,
      totalAmount,
      status: 'completed',
      isPaid: true,
      updatedAt: new Date()
    };

    await this.updateParkingTicket(updatedTicket);
    console.log(`✅ Ticket completado localmente: ${ticket.placa} - $${totalAmount}`);
    return updatedTicket;
  }

  async deleteParkingTicket(ticketId: string): Promise<void> {
    await this.init();
    await this.db.delete('parking_tickets', ticketId);
    console.log(`✅ Ticket eliminado localmente: ${ticketId}`);
  }

  // === MÉTODOS PARA TRABAJADORES ===
  async saveWorker(worker: Worker): Promise<void> {
    await this.init();
    await this.db.put('workers', worker);
    console.log(`✅ Trabajador guardado localmente: ${worker.name}`);
  }

  async getWorker(workerId: string): Promise<Worker | null> {
    await this.init();
    return (await this.db.get('workers', workerId)) || null;
  }

  async getAllWorkers(activeOnly: boolean = false): Promise<Worker[]> {
    await this.init();
    
    const allWorkers = await this.db.getAll('workers');
    
    if (activeOnly) {
      return allWorkers.filter(worker => worker.isActive);
    }
    
    return allWorkers;
  }

  async updateWorker(worker: Worker): Promise<void> {
    await this.init();
    worker.updatedAt = new Date();
    await this.db.put('workers', worker);
    console.log(`✅ Trabajador actualizado localmente: ${worker.name}`);
  }

  async deleteWorker(workerId: string): Promise<void> {
    await this.init();
    await this.db.delete('workers', workerId);
    console.log(`✅ Trabajador eliminado localmente: ${workerId}`);
  }

  // === MÉTODOS PARA SERVICIOS DE LAVADERO ===
  async saveCarwashService(service: CarwashService): Promise<void> {
    await this.init();
    await this.db.put('carwash_services', service);
    console.log(`✅ Servicio de lavadero guardado localmente: ${service.serviceName}`);
  }

  async getCarwashService(serviceId: string): Promise<CarwashService | null> {
    await this.init();
    return (await this.db.get('carwash_services', serviceId)) || null;
  }

  async getAllCarwashServices(activeOnly: boolean = false): Promise<CarwashService[]> {
    await this.init();
    
    const allServices = await this.db.getAll('carwash_services');
    
    if (activeOnly) {
      return allServices.filter(service => service.isActive);
    }
    
    return allServices;
  }

  async updateCarwashService(service: CarwashService): Promise<void> {
    await this.init();
    service.updatedAt = new Date();
    await this.db.put('carwash_services', service);
    console.log(`✅ Servicio de lavadero actualizado localmente: ${service.serviceName}`);
  }

  async deleteCarwashService(serviceId: string): Promise<void> {
    await this.init();
    await this.db.delete('carwash_services', serviceId);
    console.log(`✅ Servicio eliminado localmente: ${serviceId}`);
  }

  // === MÉTODOS PARA TRANSACCIONES DE LAVADERO ===
  async saveCarwashTransaction(transaction: CarwashTransaction): Promise<void> {
    await this.init();
    await this.db.put('carwash_transactions', transaction);
    console.log(`✅ Transacción de lavadero guardada localmente: ${transaction.placa}`);
  }

  async getCarwashTransaction(transactionId: string): Promise<CarwashTransaction | null> {
    await this.init();
    return (await this.db.get('carwash_transactions', transactionId)) || null;
  }

  async getAllCarwashTransactions(status?: string): Promise<CarwashTransaction[]> {
    await this.init();
    
    if (status) {
      const tx = this.db.transaction('carwash_transactions', 'readonly');
      const index = tx.store.index('status');
      return await index.getAll(status);
    }
    
    return await this.db.getAll('carwash_transactions');
  }

  async updateCarwashTransaction(transaction: CarwashTransaction): Promise<void> {
    await this.init();
    transaction.updatedAt = new Date();
    await this.db.put('carwash_transactions', transaction);
    console.log(`✅ Transacción actualizada localmente: ${transaction.placa}`);
  }

  async deleteCarwashTransaction(transactionId: string): Promise<void> {
    await this.init();
    await this.db.delete('carwash_transactions', transactionId);
    console.log(`✅ Transacción eliminada localmente: ${transactionId}`);
  }

  // === MÉTODOS PARA CONFIGURACIÓN DEL NEGOCIO ===
  async saveBusinessConfig(config: BusinessConfig): Promise<void> {
    await this.init();
    await this.db.put('business_config', config);
    console.log(`✅ Configuración guardada localmente: ${config.businessName}`);
  }

  async getBusinessConfig(): Promise<BusinessConfig | null> {
    await this.init();
    const configs = await this.db.getAll('business_config');
    return configs.length > 0 ? configs[0] : null;
  }

  // === MÉTODOS PARA HISTORIAL (REPORTES) ===
  async saveParkingRecord(record: any): Promise<void> {
    await this.init();
    await this.db.put('vehicle_history', record);
    console.log(`✅ Registro de historial guardado localmente: ${record.placa}`);
  }

  async getParkingHistory(): Promise<any[]> {
    await this.init();
    return await this.db.getAll('vehicle_history');
  }

  // === MÉTODOS DE UTILIDAD ===
  async clearAllData(): Promise<void> {
    await this.init();
    
    const stores = [
      'vehicles',
      'parking_tickets', 
      'workers',
      'carwash_services',
      'carwash_transactions',
      'business_config',
      'vehicle_history'
    ];

    for (const storeName of stores) {
      await this.db.clear(storeName);
    }
    
    console.log('✅ Todos los datos locales han sido eliminados');
  }

  async exportData(): Promise<any> {
    await this.init();
    
    const data = {
      vehicles: await this.db.getAll('vehicles'),
      parkingTickets: await this.db.getAll('parking_tickets'),
      workers: await this.db.getAll('workers'),
      carwashServices: await this.db.getAll('carwash_services'),
      carwashTransactions: await this.db.getAll('carwash_transactions'),
      businessConfig: await this.db.getAll('business_config'),
      vehicleHistory: await this.db.getAll('vehicle_history'),
      exportDate: new Date().toISOString()
    };

    console.log('✅ Datos exportados correctamente');
    return data;
  }

  async importData(data: any): Promise<void> {
    await this.init();
    
    try {
      // Limpiar datos existentes
      await this.clearAllData();

      // Importar cada tipo de dato
      if (data.vehicles) {
        for (const item of data.vehicles) {
          await this.db.put('vehicles', item);
        }
      }

      if (data.parkingTickets) {
        for (const item of data.parkingTickets) {
          await this.db.put('parking_tickets', item);
        }
      }

      if (data.workers) {
        for (const item of data.workers) {
          await this.db.put('workers', item);
        }
      }

      if (data.carwashServices) {
        for (const item of data.carwashServices) {
          await this.db.put('carwash_services', item);
        }
      }

      if (data.carwashTransactions) {
        for (const item of data.carwashTransactions) {
          await this.db.put('carwash_transactions', item);
        }
      }

      if (data.businessConfig) {
        for (const item of data.businessConfig) {
          await this.db.put('business_config', item);
        }
      }

      if (data.vehicleHistory) {
        for (const item of data.vehicleHistory) {
          await this.db.put('vehicle_history', item);
        }
      }

      console.log('✅ Datos importados correctamente');
    } catch (error) {
      console.error('❌ Error importando datos:', error);
      throw error;
    }
  }

  // === MÉTODOS PARA TIPOS DE VEHÍCULOS ===
  async saveVehicleType(vehicleType: VehicleTypeConfig): Promise<void> {
    await this.init();
    
    // Obtener configuración actual o crear una por defecto
    let config = await this.getBusinessConfig();
    if (!config) {
      console.log('⚠️ No existe configuración, creando una por defecto...');
      const defaultConfig: BusinessConfig = {
        id: 'default-config',
        businessName: 'Wilson Cars & Wash',
        businessAddress: '',
        businessPhone: '',
        carParkingRate: 2000,
        motorcycleParkingRate: 1500,
        truckParkingRate: 3000,
        carwashEnabled: true,
        parkingEnabled: true,
        vehicleTypes: [],
        ticketData: {
          companyName: 'Wilson Cars & Wash',
          companySubtitle: 'Parqueadero y Lavadero',
          nit: '000000000-0',
          address: '',
          phone: '',
          email: '',
          website: '',
          footerMessage: 'Gracias por su visita',
          footerInfo: 'Servicio 24/7'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.saveBusinessConfig(defaultConfig);
      config = defaultConfig;
    }

    // Verificar que no exista un tipo con el mismo nombre
    const existingTypes = config.vehicleTypes || [];
    const isDuplicate = existingTypes.some(type => 
      type.name.toLowerCase() === vehicleType.name.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('Ya existe un tipo de vehículo con este nombre');
    }

    // Agregar el nuevo tipo
    const updatedConfig = {
      ...config,
      vehicleTypes: [...existingTypes, vehicleType],
      updatedAt: new Date()
    };

    await this.saveBusinessConfig(updatedConfig);
    console.log(`✅ Tipo de vehículo guardado: ${vehicleType.name}`);
  }

  async getVehicleTypes(): Promise<VehicleTypeConfig[]> {
    await this.init();
    
    const config = await this.getBusinessConfig();
    return config?.vehicleTypes || [];
  }

  async updateVehicleType(vehicleTypeId: string, updates: Partial<VehicleTypeConfig>): Promise<void> {
    await this.init();
    
    const config = await this.getBusinessConfig();
    if (!config) {
      throw new Error('No se encontró configuración del negocio');
    }

    const vehicleTypes = config.vehicleTypes || [];
    const typeIndex = vehicleTypes.findIndex(type => type.id === vehicleTypeId);
    
    if (typeIndex === -1) {
      throw new Error('Tipo de vehículo no encontrado');
    }

    // Actualizar el tipo
    vehicleTypes[typeIndex] = {
      ...vehicleTypes[typeIndex],
      ...updates,
      updatedAt: new Date()
    };

    const updatedConfig = {
      ...config,
      vehicleTypes,
      updatedAt: new Date()
    };

    await this.saveBusinessConfig(updatedConfig);
    console.log(`✅ Tipo de vehículo actualizado: ${vehicleTypeId}`);
  }

  async deleteVehicleType(vehicleTypeId: string): Promise<void> {
    await this.init();
    
    const config = await this.getBusinessConfig();
    if (!config) {
      throw new Error('No se encontró configuración del negocio');
    }

    const vehicleTypes = config.vehicleTypes || [];
    const typeToDelete = vehicleTypes.find(type => type.id === vehicleTypeId);
    
    if (!typeToDelete) {
      throw new Error('Tipo de vehículo no encontrado');
    }

    // No permitir eliminar tipos predeterminados
    if (!typeToDelete.isCustom) {
      throw new Error('No se pueden eliminar tipos de vehículo predeterminados');
    }

    // Filtrar el tipo a eliminar
    const updatedVehicleTypes = vehicleTypes.filter(type => type.id !== vehicleTypeId);

    const updatedConfig = {
      ...config,
      vehicleTypes: updatedVehicleTypes,
      updatedAt: new Date()
    };

    await this.saveBusinessConfig(updatedConfig);
    console.log(`✅ Tipo de vehículo eliminado: ${typeToDelete.name}`);
  }
}

// Instancia singleton
const localDatabase = new LocalDatabase();

// Función helper para obtener la instancia
export function getLocalDB(): LocalDatabase {
  return localDatabase;
}

// Exportar instancia por defecto
export const localDB = localDatabase;
export default localDatabase;