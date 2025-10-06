/**
 * Sistema simple de eventos para comunicación entre componentes
 */

type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

// Singleton para eventos de la aplicación
export const appEvents = new EventEmitter();

// Eventos disponibles
export const APP_EVENTS = {
  VEHICLE_TYPE_ADDED: 'vehicle-type-added',
  VEHICLE_TYPE_UPDATED: 'vehicle-type-updated',
  VEHICLE_TYPE_DELETED: 'vehicle-type-deleted',
  CONFIG_UPDATED: 'config-updated',
  CARWASH_ORDER_UPDATED: 'carwash-order-updated', // 🔄 Evento para actualización de órdenes del lavadero
} as const;
