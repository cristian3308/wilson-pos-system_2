# 📄 Exportación de Informes a PDF

## ✅ Implementado en BalanceDashboard

Se ha cambiado la exportación de **Excel a PDF** en la sección de **"Ver Informes y Estadísticas"**.

---

## 🎨 Diseño del PDF

### Estructura del Documento:

1. **Encabezado**
   - Nombre de la empresa (grande y centrado)
   - Dirección del negocio
   - Línea separadora en color teal (#009688)

2. **Título del Reporte**
   - "INFORME DE BALANCE - [PERÍODO]"
   - Fecha de inicio y fin del período
   - Color teal para destacar

3. **Tabla de Ingresos**
   | Concepto | Cantidad | Monto |
   |----------|----------|-------|
   | 🚗 Ingresos de Parqueadero | X servicios | $XXX,XXX |
   | 🧼 Ingresos de Lavadero (Empresa) | X servicios | $XXX,XXX |
   | 👨‍💼 Comisiones Trabajadores | - | $XXX,XXX |
   
   - Fondo verde azulado en encabezados
   - Texto blanco en encabezados
   - Bordes de cuadrícula

4. **Tabla de Totales**
   | Concepto | Cantidad | Monto |
   |----------|----------|-------|
   | 💰 TOTAL BRUTO | X servicios | $XXX,XXX |
   | ✅ TOTAL NETO (Empresa) | - | $XXX,XXX |
   | 📊 Promedio Diario | - | $XXX,XXX |
   
   - Fondo gris claro
   - Montos en color teal destacado
   - Sin bordes (estilo limpio)

5. **Mejor Trabajador** (si existe)
   - 🏆 MEJOR TRABAJADOR DEL PERÍODO
   - Nombre del trabajador
   - Comisiones ganadas

6. **Comparación con Período Anterior**
   - 📈 Aumento del X% (verde si positivo)
   - 📉 Disminución del X% (rojo si negativo)

7. **Pie de Página**
   - Fecha y hora de generación
   - "Sistema POS - Wilson Cars & Wash"
   - Texto en gris claro e itálico

---

## 🎯 Características del PDF

✅ **Diseño Profesional**:
- Tipografía Helvetica
- Colores corporativos (teal: #009688)
- Espaciado adecuado entre secciones

✅ **Información Completa**:
- Datos de la empresa
- Período del reporte
- Desglose detallado de ingresos
- Totales y promedios
- Estadísticas de trabajadores

✅ **Formato Limpio**:
- Tablas con autoTable (formato profesional)
- Iconos para identificación visual
- Alineación correcta de montos
- Moneda formateada ($XXX,XXX)

✅ **Nombre del Archivo**:
- Formato: `Informe_Balance_YYYY-MM-DD_YYYY-MM-DD.pdf`
- Ejemplo: `Informe_Balance_2025-10-05_2025-10-12.pdf`

---

## 🔄 Cambios Realizados

### 1. **BalanceDashboard.tsx**

**Importaciones agregadas:**
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText } from 'lucide-react';
```

**Función nueva:**
- ❌ Eliminada: `exportToExcel()` → generaba CSV
- ✅ Nueva: `exportToPDF()` → genera PDF profesional

**Botón actualizado:**
```tsx
<button onClick={exportToPDF}>
  <FileText className="w-5 h-5" />
  Exportar PDF
</button>
```
- Color cambiado de verde a rojo
- Icono cambiado de FileSpreadsheet a FileText

---

## 📊 Ejemplo Visual del PDF

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║           WILSON CARS & WASH                     ║
║        Calle 123 #45-67, Bogotá D.C.            ║
║                                                  ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                  ║
║     INFORME DE BALANCE - ÚLTIMA SEMANA           ║
║  Período: 05 de octubre - 12 de octubre 2025    ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  ┌─────────────────────────────────────────┐    ║
║  │ Concepto          │ Cantidad │ Monto    │    ║
║  ├─────────────────────────────────────────┤    ║
║  │ 🚗 Parqueadero    │ 45 svcs  │ $135,000 │    ║
║  │ 🧼 Lavadero       │ 23 svcs  │ $345,000 │    ║
║  │ 👨‍💼 Comisiones    │    -     │ $115,000 │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
║  ┌─────────────────────────────────────────┐    ║
║  │ 💰 TOTAL BRUTO    │ 68 svcs  │ $480,000 │    ║
║  │ ✅ TOTAL NETO     │    -     │ $365,000 │    ║
║  │ 📊 Promedio Diario│    -     │ $52,143  │    ║
║  └─────────────────────────────────────────┘    ║
║                                                  ║
║  🏆 MEJOR TRABAJADOR DEL PERÍODO                ║
║     Nombre: Juan Pérez                          ║
║     Comisiones ganadas: $45,000                 ║
║                                                  ║
║  📈 Aumento del 12.5% respecto al período       ║
║     anterior                                     ║
║                                                  ║
║ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ║
║                                                  ║
║   Generado el 12 de octubre de 2025 a las 14:30 ║
║        Sistema POS - Wilson Cars & Wash         ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## 🚀 Cómo Usar

1. **Ir a Dashboard Principal**
2. **Click en "📊 Ver Informes y Estadísticas"**
3. **Seleccionar período** (Última Semana, Últimas 2 Semanas, Este Mes, o Personalizado)
4. **Click en "📄 Exportar PDF"**
5. **El PDF se descarga automáticamente**

---

## 📝 Notas Técnicas

- ✅ Compatible con todos los navegadores modernos
- ✅ No requiere instalación de software adicional
- ✅ Genera archivos PDF estándar (compatible con Adobe Reader, etc.)
- ✅ Tamaño de archivo optimizado
- ✅ Formato de página: A4
- ✅ Márgenes: 20px laterales

---

## 🎨 Paleta de Colores

| Color | Uso |
|-------|-----|
| `#009688` (Teal) | Encabezados, títulos, montos destacados |
| `#F0F0F0` (Gris claro) | Fondos de tablas de totales |
| `#22C55E` (Verde) | Indicadores positivos |
| `#DC3545` (Rojo) | Indicadores negativos, botón PDF |
| `#646464` (Gris medio) | Textos secundarios |
| `#000000` (Negro) | Textos principales |

---

**Fecha de Implementación:** 12 de Octubre de 2025  
**Tecnología:** jsPDF + jspdf-autotable  
**Estado:** ✅ Implementado y Funcional
