// Types and interfaces for the parking and carwash system
export interface SystemHealth {
  status: 'online' | 'offline' | 'maintenance';
  timestamp: string;
  environment: 'development' | 'production' | 'staging';
  uptime?: number;
  version?: string;
}

export interface VehicleTypeStats {
  carro: number;
  moto: number;
  bicicleta: number;
}

export interface CarwashServiceStats {
  basico: number;
  completo: number;
  premium: number;
}

export interface DailyReport {
  fecha: string;
  ingresosParqueadero: number;
  ingresosLavadero: number;
  ingresosTotales: number;
  vehiculosPorTipo: VehicleTypeStats;
  serviciosLavadero: CarwashServiceStats;
  espaciosOcupados: number;
  totalEspacios: number;
  promedioOcupacion?: number;
  vehiculosAtendidos?: number;
  tiempoPromedioEstancia?: number;
}

export interface DashboardMetrics {
  ingresosTotales: number;
  ingresosParqueadero: number;
  ingresosLavadero: number;
  vehiculosActivos: number;
  ordenesLavadero: number;
  vehiculosPorTipo: VehicleTypeStats;
  serviciosLavadero: CarwashServiceStats;
  ocupacionPorcentaje: number;
  tendenciaIngresos?: 'up' | 'down' | 'stable';
  comparativaAyer?: {
    ingresos: number;
    vehiculos: number;
    porcentajeCambio: number;
  };
}

export interface Vehicle {
  id: string;
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'bicicleta';
  espacioAsignado: string;
  horaEntrada: string;
  propietario?: string;
  telefono?: string;
  observaciones?: string;
  tiempoTranscurrido?: string;
  costoActual?: number;
  estado: 'activo' | 'pagado' | 'vencido';
}

export interface CarwashService {
  id: string;
  nombre: string;
  precio: number;
  duracion: number; // minutos
  descripcion: string;
  icono: string;
  categoria: 'basico' | 'premium' | 'especializado';
  disponible: boolean;
}

export interface CarwashOrder {
  id: string;
  numeroOrden: string;
  placaVehiculo: string;
  servicios: CarwashService[];
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  horaCreacion: string;
  horaInicio?: string;
  horaFinalizacion?: string;
  cliente?: {
    nombre: string;
    telefono: string;
    email?: string;
  };
  observaciones?: string;
  total: number;
  tiempoEstimado: number;
  trabajadorAsignado?: string;
  prioridad: 'normal' | 'urgente';
  descuentos?: number;
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
}

export interface ParkingRate {
  carro: { hora: number; dia: number; noche: number };
  moto: { hora: number; dia: number; noche: number };
  bicicleta: { hora: number; dia: number; noche: number };
}

export interface SystemNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  errors?: string[];
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type ViewMode = 'dashboard' | 'parqueadero' | 'lavadero' | 'reportes' | 'configuracion';
export type ParkingMode = 'entrada' | 'salida' | 'gestion';
export type CarwashMode = 'crear' | 'gestionar' | 'historial';

// Default values and constants
export const DEFAULT_VEHICLE_STATS: VehicleTypeStats = {
  carro: 0,
  moto: 0,
  bicicleta: 0
};

export const DEFAULT_CARWASH_STATS: CarwashServiceStats = {
  basico: 0,
  completo: 0,
  premium: 0
};

export const DEFAULT_PARKING_RATES: ParkingRate = {
  carro: { hora: 3000, dia: 25000, noche: 2000 },
  moto: { hora: 2000, dia: 15000, noche: 1500 },
  bicicleta: { hora: 1000, dia: 8000, noche: 800 }
};

// Validation helpers
export const isValidPlate = (plate: string): boolean => {
  return /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/.test(plate);
};

export const isValidPhone = (phone: string): boolean => {
  return /^3\d{9}$/.test(phone);
};

// Data transformation utilities
export const safeGetVehicleStats = (data: any): VehicleTypeStats => {
  if (!data || typeof data !== 'object') return DEFAULT_VEHICLE_STATS;
  
  return {
    carro: Number(data.carro) || 0,
    moto: Number(data.moto) || 0,
    bicicleta: Number(data.bicicleta) || 0
  };
};

export const safeGetCarwashStats = (data: any): CarwashServiceStats => {
  if (!data || typeof data !== 'object') return DEFAULT_CARWASH_STATS;
  
  return {
    basico: Number(data.basico) || 0,
    completo: Number(data.completo) || 0,
    premium: Number(data.premium) || 0
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateDuration = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};