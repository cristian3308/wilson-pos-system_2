// Sistema de base de datos local: Solo IndexedDB (sin Firebase)
import { localDB, getLocalDB } from './localDatabase';

// Re-exportar todos los tipos
export type {
  Worker,
  CarwashService,
  CarwashTransaction,
  Vehicle,
  ParkingTicket,
  BusinessConfig,
  MonthlySubscription // ✅ Agregar tipo de suscripción
} from './localDatabase';

// Clase wrapper para mantener compatibilidad con el código existente
class DualDatabase {
  private localDb = getLocalDB();

  // === MÉTODOS PARA VEHÍCULOS ===
  async saveVehicle(vehicle: any): Promise<void> {
    return await this.localDb.saveVehicle(vehicle);
  }

  async getVehicle(vehicleId: string): Promise<any> {
    return await this.localDb.getVehicle(vehicleId);
  }

  async getAllVehicles(): Promise<any[]> {
    return await this.localDb.getAllVehicles();
  }

  async updateVehicle(vehicle: any): Promise<void> {
    return await this.localDb.updateVehicle(vehicle);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    return await this.localDb.deleteVehicle(vehicleId);
  }

  // === MÉTODOS PARA TICKETS DE PARQUEADERO ===
  async saveParkingTicket(ticket: any): Promise<void> {
    return await this.localDb.saveParkingTicket(ticket);
  }

  async getParkingTicket(ticketId: string): Promise<any> {
    return await this.localDb.getParkingTicket(ticketId);
  }

  async getParkingTickets(status?: string): Promise<any[]> {
    return await this.localDb.getParkingTickets(status as any);
  }

  async updateParkingTicket(ticket: any): Promise<void> {
    return await this.localDb.updateParkingTicket(ticket);
  }

  async completeParkingTicket(ticketId: string, exitTime?: Date): Promise<any> {
    return await this.localDb.completeParkingTicket(ticketId, exitTime);
  }

  async deleteParkingTicket(ticketId: string): Promise<void> {
    return await this.localDb.deleteParkingTicket(ticketId);
  }

  // === MÉTODOS PARA TRABAJADORES ===
  async saveWorker(worker: any): Promise<void> {
    return await this.localDb.saveWorker(worker);
  }

  async getWorker(workerId: string): Promise<any> {
    return await this.localDb.getWorker(workerId);
  }

  async getAllWorkers(activeOnly?: boolean): Promise<any[]> {
    return await this.localDb.getAllWorkers(activeOnly);
  }

  async updateWorker(worker: any): Promise<void> {
    return await this.localDb.updateWorker(worker);
  }

  async deleteWorker(workerId: string): Promise<void> {
    return await this.localDb.deleteWorker(workerId);
  }

  // === MÉTODOS PARA SERVICIOS DE LAVADERO ===
  async saveCarwashService(service: any): Promise<void> {
    return await this.localDb.saveCarwashService(service);
  }

  async getCarwashService(serviceId: string): Promise<any> {
    return await this.localDb.getCarwashService(serviceId);
  }

  async getAllCarwashServices(activeOnly?: boolean): Promise<any[]> {
    return await this.localDb.getAllCarwashServices(activeOnly);
  }

  async updateCarwashService(service: any): Promise<void> {
    return await this.localDb.updateCarwashService(service);
  }

  async deleteCarwashService(serviceId: string): Promise<void> {
    return await this.localDb.deleteCarwashService(serviceId);
  }

  // === MÉTODOS PARA TRANSACCIONES DE LAVADERO ===
  async saveCarwashTransaction(transaction: any): Promise<void> {
    return await this.localDb.saveCarwashTransaction(transaction);
  }

  async getCarwashTransaction(transactionId: string): Promise<any> {
    return await this.localDb.getCarwashTransaction(transactionId);
  }

  async getAllCarwashTransactions(status?: string): Promise<any[]> {
    return await this.localDb.getAllCarwashTransactions(status);
  }

  async updateCarwashTransaction(transaction: any): Promise<void> {
    return await this.localDb.updateCarwashTransaction(transaction);
  }

  async deleteCarwashTransaction(transactionId: string): Promise<void> {
    return await this.localDb.deleteCarwashTransaction(transactionId);
  }

  // === MÉTODOS PARA CONFIGURACIÓN DEL NEGOCIO ===
  async saveBusinessConfig(config: any): Promise<void> {
    return await this.localDb.saveBusinessConfig(config);
  }

  async getBusinessConfig(): Promise<any> {
    return await this.localDb.getBusinessConfig();
  }

  // === MÉTODOS PARA HISTORIAL ===
  async saveParkingRecord(record: any): Promise<void> {
    return await this.localDb.saveParkingRecord(record);
  }

  async getParkingHistory(): Promise<any[]> {
    return await this.localDb.getParkingHistory();
  }

  // === MÉTODOS PARA SUSCRIPCIONES MENSUALES ===
  async saveMonthlySubscription(subscription: any): Promise<void> {
    return await this.localDb.saveMonthlySubscription(subscription);
  }

  async getMonthlySubscription(subscriptionId: string): Promise<any> {
    return await this.localDb.getMonthlySubscription(subscriptionId);
  }

  async getAllMonthlySubscriptions(activeOnly?: boolean): Promise<any[]> {
    return await this.localDb.getAllMonthlySubscriptions(activeOnly);
  }

  async getActiveMonthlySubscriptions(): Promise<any[]> {
    return await this.localDb.getActiveMonthlySubscriptions();
  }

  async getSubscriptionByPlate(vehiclePlate: string): Promise<any> {
    return await this.localDb.getSubscriptionByPlate(vehiclePlate);
  }

  async getExpiringSubscriptions(daysBeforeExpiry?: number): Promise<any[]> {
    return await this.localDb.getExpiringSubscriptions(daysBeforeExpiry);
  }

  async updateMonthlySubscription(subscription: any): Promise<void> {
    return await this.localDb.updateMonthlySubscription(subscription);
  }

  async deleteMonthlySubscription(subscriptionId: string): Promise<void> {
    return await this.localDb.deleteMonthlySubscription(subscriptionId);
  }

  async checkAndDeactivateExpiredSubscriptions(): Promise<number> {
    return await this.localDb.checkAndDeactivateExpiredSubscriptions();
  }

  // === MÉTODOS DE UTILIDAD ===
  async clearAllData(): Promise<void> {
    return await this.localDb.clearAllData();
  }

  async exportData(): Promise<any> {
    return await this.localDb.exportData();
  }

  async importData(data: any): Promise<void> {
    return await this.localDb.importData(data);
  }

  // Métodos que no hacen nada (compatibilidad)
  async syncToFirebase(): Promise<void> {
    console.log('📱 Firebase sync deshabilitado - funcionando solo localmente');
  }

  async syncFromFirebase(): Promise<void> {
    console.log('📱 Firebase sync deshabilitado - funcionando solo localmente');
  }

  async addToSyncQueue(): Promise<void> {
    // No hacer nada - no hay sync
  }

  async processSyncQueue(): Promise<void> {
    // No hacer nada - no hay sync
  }

  // Métodos heredados para compatibilidad
  sanitizeDatesForFirebase(data: any): any {
    // Solo devolver los datos tal como están
    return data;
  }
}

// Instancia singleton
const dualDatabase = new DualDatabase();

// Funciones helper para mantener compatibilidad
export function getDualDB(): DualDatabase {
  return dualDatabase;
}

// Exportar instancia por defecto
export { dualDatabase };
export default dualDatabase;