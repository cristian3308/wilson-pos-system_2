// Utilidades para manejo seguro de fechas

/**
 * Convierte de manera segura cualquier valor a un Date válido
 * @param dateValue - Valor a convertir (Date, string, number, etc.)
 * @param fallbackDate - Fecha por defecto si la conversión falla (por defecto: new Date())
 * @returns Date válido
 */
export function safeDate(dateValue: any, fallbackDate: Date = new Date()): Date {
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? fallbackDate : dateValue;
  }
  
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? fallbackDate : parsed;
  }
  
  return fallbackDate;
}

/**
 * Obtiene de manera segura el timestamp de una fecha
 * @param dateValue - Valor de fecha
 * @param fallbackTime - Timestamp por defecto si la conversión falla (por defecto: Date.now())
 * @returns Timestamp válido
 */
export function safeGetTime(dateValue: any, fallbackTime: number = Date.now()): number {
  const date = safeDate(dateValue, new Date(fallbackTime));
  return date.getTime();
}

/**
 * Calcula de manera segura la diferencia entre dos fechas
 * @param endDate - Fecha final
 * @param startDate - Fecha inicial
 * @returns Diferencia en milisegundos
 */
export function safeDateDiff(endDate: any, startDate: any): number {
  const end = safeDate(endDate);
  const start = safeDate(startDate);
  return end.getTime() - start.getTime();
}

/**
 * Valida si un valor es una fecha válida
 * @param dateValue - Valor a validar
 * @returns true si es una fecha válida
 */
export function isValidDate(dateValue: any): boolean {
  if (dateValue instanceof Date) {
    return !isNaN(dateValue.getTime());
  }
  
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return !isNaN(parsed.getTime());
  }
  
  return false;
}

/**
 * Convierte una fecha a formato ISO de manera segura para Firebase
 * @param dateValue - Valor de fecha
 * @returns String ISO o null si la fecha es inválida
 */
export function safeToISOString(dateValue: any): string | null {
  const date = safeDate(dateValue, null as any);
  if (!date || !isValidDate(date)) {
    return null;
  }
  
  try {
    return date.toISOString();
  } catch (error) {
    console.warn('Error converting date to ISO string:', error);
    return null;
  }
}