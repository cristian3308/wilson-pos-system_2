// Inicializador de base de datos local (sin Firebase)
import { localDB } from '../lib/localDatabase';

// Datos iniciales para trabajadores
const initialWorkers = [
  {
    id: 'worker_001',
    name: 'Juan Pérez',
    phone: '3001234567',
    email: 'juan@email.com',
    percentage: 60,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'worker_002', 
    name: 'María García',
    phone: '3009876543',
    email: 'maria@email.com',
    percentage: 65,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Servicios iniciales de lavadero
const initialCarwashServices = [
  {
    id: 'service_001',
    vehicleType: 'car',
    serviceName: 'Lavado Básico Carro',
    basePrice: 15000,
    estimatedTime: 30,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service_002',
    vehicleType: 'motorcycle', 
    serviceName: 'Lavado Básico Moto',
    basePrice: 8000,
    estimatedTime: 20,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'service_003',
    vehicleType: 'truck',
    serviceName: 'Lavado Básico Camión',
    basePrice: 25000,
    estimatedTime: 45,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Configuración inicial del negocio
const initialBusinessConfig = {
  id: 'business_config_001',
  businessName: 'Parqueadero y Lavadero Local',
  businessAddress: 'Calle Principal 123',
  businessPhone: '3001234567',
  carParkingRate: 3000,
  motorcycleParkingRate: 2000,
  truckParkingRate: 4000,
  carwashEnabled: true,
  parkingEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Inicializa la base de datos local con datos por defecto
 */
export async function initializeLocalDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Inicializando base de datos local...');

    // Verificar si ya existe configuración del negocio
    const existingConfig = await localDB.getBusinessConfig();
    
    if (!existingConfig) {
      console.log('📝 Creando datos iniciales...');
      
      // Insertar configuración del negocio
      await localDB.saveBusinessConfig(initialBusinessConfig);
      console.log('✅ Configuración del negocio creada');

      // Insertar trabajadores iniciales
      for (const worker of initialWorkers) {
        await localDB.saveWorker(worker);
      }
      console.log('✅ Trabajadores iniciales creados');

      // Insertar servicios de lavadero iniciales
      for (const service of initialCarwashServices) {
        await localDB.saveCarwashService(service);
      }
      console.log('✅ Servicios de lavadero iniciales creados');

      console.log('🎉 Base de datos local inicializada correctamente');
      return { 
        success: true, 
        message: 'Base de datos local inicializada con datos por defecto' 
      };
    } else {
      console.log('✅ Base de datos local ya está inicializada');
      return { 
        success: true, 
        message: 'Base de datos local ya existía' 
      };
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos local:', error);
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
}

/**
 * Función para verificar el estado de la base de datos local
 */
export async function checkLocalDatabaseStatus(): Promise<{
  isInitialized: boolean;
  workersCount: number;
  servicesCount: number;
  hasBusinessConfig: boolean;
}> {
  try {
    const businessConfig = await localDB.getBusinessConfig();
    const workers = await localDB.getAllWorkers();
    const services = await localDB.getAllCarwashServices();

    return {
      isInitialized: !!businessConfig,
      workersCount: workers.length,
      servicesCount: services.length,
      hasBusinessConfig: !!businessConfig
    };
  } catch (error) {
    console.error('Error checking database status:', error);
    return {
      isInitialized: false,
      workersCount: 0,
      servicesCount: 0,
      hasBusinessConfig: false
    };
  }
}

/**
 * Función para limpiar y reinicializar la base de datos
 */
export async function resetLocalDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔄 Limpiando base de datos local...');
    
    await localDB.clearAllData();
    console.log('✅ Datos limpiados');
    
    return await initializeLocalDatabase();
  } catch (error) {
    console.error('❌ Error reinicializando base de datos:', error);
    return { 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
}