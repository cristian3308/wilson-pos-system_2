# 📊 Sistema de Cobro por Medias Horas

## 🎯 Nueva Lógica Implementada

El sistema ahora cobra por **fracciones de media hora**:

### Regla Base:
- **1-29 minutos** = **50% del precio/hora** (media hora)
- **30-60 minutos** = **100% del precio/hora** (hora completa)
- **Cada hora adicional** se suma siguiendo la misma regla

---

## 💰 Tarifas Base

| Vehículo | Precio/Hora | Media Hora (1-29 min) |
|----------|-------------|----------------------|
| 🏍️ Moto | $2,000 | $1,000 |
| 🚗 Carro | $3,000 | $1,500 |
| 🚛 Camión | $4,000 | $2,000 |

---

## 📋 Tabla de Ejemplos

### 🏍️ MOTO ($2,000/hora)

| Tiempo | Cálculo | Total |
|--------|---------|-------|
| 1 min | 1-29 min = $1,000 | **$1,000** |
| 15 min | 1-29 min = $1,000 | **$1,000** |
| 29 min | 1-29 min = $1,000 | **$1,000** |
| 30 min | 30-60 min = $2,000 | **$2,000** |
| 45 min | 30-60 min = $2,000 | **$2,000** |
| 60 min | 1h = $2,000 | **$2,000** |
| 1h 15min | 1h ($2,000) + 15min ($1,000) | **$3,000** |
| 1h 29min | 1h ($2,000) + 29min ($1,000) | **$3,000** |
| 1h 30min | 1h ($2,000) + 30min ($2,000) | **$4,000** |
| 1h 45min | 1h ($2,000) + 45min ($2,000) | **$4,000** |
| 2h | 2h ($4,000) | **$4,000** |
| 2h 15min | 2h ($4,000) + 15min ($1,000) | **$5,000** |
| 2h 30min | 2h ($4,000) + 30min ($2,000) | **$6,000** |

---

### 🚗 CARRO ($3,000/hora)

| Tiempo | Cálculo | Total |
|--------|---------|-------|
| 1 min | 1-29 min = $1,500 | **$1,500** |
| 15 min | 1-29 min = $1,500 | **$1,500** |
| 29 min | 1-29 min = $1,500 | **$1,500** |
| 30 min | 30-60 min = $3,000 | **$3,000** |
| 45 min | 30-60 min = $3,000 | **$3,000** |
| 60 min | 1h = $3,000 | **$3,000** |
| 1h 15min | 1h ($3,000) + 15min ($1,500) | **$4,500** |
| 1h 29min | 1h ($3,000) + 29min ($1,500) | **$4,500** |
| 1h 30min | 1h ($3,000) + 30min ($3,000) | **$6,000** |
| 1h 45min | 1h ($3,000) + 45min ($3,000) | **$6,000** |
| 2h | 2h ($6,000) | **$6,000** |
| 2h 15min | 2h ($6,000) + 15min ($1,500) | **$7,500** |
| 2h 30min | 2h ($6,000) + 30min ($3,000) | **$9,000** |

---

### 🚛 CAMIÓN ($4,000/hora)

| Tiempo | Cálculo | Total |
|--------|---------|-------|
| 1 min | 1-29 min = $2,000 | **$2,000** |
| 15 min | 1-29 min = $2,000 | **$2,000** |
| 29 min | 1-29 min = $2,000 | **$2,000** |
| 30 min | 30-60 min = $4,000 | **$4,000** |
| 45 min | 30-60 min = $4,000 | **$4,000** |
| 60 min | 1h = $4,000 | **$4,000** |
| 1h 15min | 1h ($4,000) + 15min ($2,000) | **$6,000** |
| 1h 29min | 1h ($4,000) + 29min ($2,000) | **$6,000** |
| 1h 30min | 1h ($4,000) + 30min ($4,000) | **$8,000** |
| 1h 45min | 1h ($4,000) + 45min ($4,000) | **$8,000** |
| 2h | 2h ($8,000) | **$8,000** |
| 2h 15min | 2h ($8,000) + 15min ($2,000) | **$10,000** |
| 2h 30min | 2h ($8,000) + 30min ($4,000) | **$12,000** |

---

## 🔧 Archivos Modificados

1. **`parkingSystem.ts`** - Función `calculateFinalAmount()`:
   - Calcula horas completas
   - Evalúa minutos restantes
   - Aplica 50% o 100% según la fracción

2. **`BusinessConfigurationPanel.tsx`** - Función `recalculateParkingAmount()`:
   - Misma lógica para recálculos manuales
   - Auto-actualización al editar tiempos

3. **`BusinessConfigurationPanel.tsx`** - Botón "Recalcular Todos los Montos":
   - Actualiza TODOS los registros históricos
   - Aplica la nueva lógica a registros antiguos

---

## ✅ Cómo Probar

1. **Nuevo Registro**:
   - Ve a Parqueadero
   - Registra entrada de un vehículo
   - Espera 15 minutos
   - Procesa salida
   - ✅ Debería cobrar media hora ($1,000 moto / $1,500 carro)

2. **Actualizar Registros Antiguos**:
   - Ve a Configuración Empresarial
   - Baja a "Historial Detallado de Operaciones"
   - Click en **"🔄 Recalcular Todos los Montos"**
   - ✅ Todos los registros se actualizarán con la nueva lógica

3. **Editar Registro Manual**:
   - En el historial, click en ✏️ Editar
   - Cambia la hora de entrada o salida
   - ✅ El monto se recalcula automáticamente

---

## 🎯 Validación Rápida

Prueba con estos casos:

| Tiempo | Moto | Carro |
|--------|------|-------|
| 1 min | $1,000 ✅ | $1,500 ✅ |
| 29 min | $1,000 ✅ | $1,500 ✅ |
| 30 min | $2,000 ✅ | $3,000 ✅ |
| 1h 15min | $3,000 ✅ | $4,500 ✅ |
| 1h 30min | $4,000 ✅ | $6,000 ✅ |

---

## 📝 Notas Importantes

- ✅ La lógica se aplica **automáticamente** a nuevos registros
- ✅ Los registros antiguos se pueden actualizar con el botón
- ✅ Al editar manualmente, el cálculo se hace en tiempo real
- ✅ Mínimo cobro: media hora (50% del precio/hora)
- ✅ No hay cobro por minutos exactos, solo medias horas

---

**Fecha de Implementación:** 12 de Octubre de 2025
**Sistema:** POS Web Professional v2.0
