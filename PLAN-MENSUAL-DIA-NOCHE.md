# 🌙☀️ Sistema de Planes Mensuales - Noche y Día

## 📋 Resumen de Cambios Solicitados

### 1. **Planes Mensuales con Modalidad Noche/Día**
   - Agregar opción de seleccionar "Noche" o "Día" al crear un plan mensual
   - Cada modalidad tendrá su propio precio configurable
   - Los precios se configuran en "Configuración Empresarial"

### 2. **Simplificación de Configuración Empresarial** ✅ COMPLETADO
   - ✅ Eliminados: Teléfono, Email, Sitio Web, Nombre Empresa, Subtítulo, NIT
   - ✅ Eliminados: Mensajes personalizados
   - ✅ **Solo se mantiene**: Dirección Completa

### 3. **Nuevo Ticket de Planes Mensuales**
   - Crear ticket similar al de parqueadero (diseño simple)
   - Mostrar claramente si es modalidad "Noche" o "Día"
   - Incluir logo, fecha, placa, tipo de plan, precio

---

## 🔧 Implementación Necesaria

### PASO 1: Agregar Configuración de Precios en BusinessConfigurationPanel

Necesitas agregar una nueva sección después de la dirección:

```typescript
// En BusinessConfigurationPanel.tsx

// 1. Agregar al estado de configuración:
monthlyPlanPrices: {
  day: 50000,  // Precio diario
  night: 40000 // Precio nocturno
}

// 2. Agregar sección en el render (después de la dirección):
<div className="mt-6">
  <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-purple-200">
    <div className="p-2 bg-purple-500 rounded-lg">
      <DollarSign className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-lg font-bold text-gray-800">Precios Planes Mensuales</h3>
  </div>
  
  <div className="grid md:grid-cols-2 gap-4">
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
      <label className="block text-sm font-bold text-yellow-800 uppercase tracking-wide mb-3">
        ☀️ Precio Plan Diurno
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3 text-yellow-600 font-bold">$</span>
        <input
          type="number"
          value={config.monthlyPlanPrices?.day || 0}
          onChange={(e) => updateMonthlyPlanPrice('day', parseFloat(e.target.value))}
          className="w-full pl-8 pr-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-800 text-lg font-semibold"
          placeholder="50000"
        />
      </div>
      <p className="text-xs text-yellow-700 mt-2">Precio para planes mensuales de día</p>
    </div>

    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
      <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3">
        🌙 Precio Plan Nocturno
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3 text-indigo-600 font-bold">$</span>
        <input
          type="number"
          value={config.monthlyPlanPrices?.night || 0}
          onChange={(e) => updateMonthlyPlanPrice('night', parseFloat(e.target.value))}
          className="w-full pl-8 pr-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800 text-lg font-semibold"
          placeholder="40000"
        />
      </div>
      <p className="text-xs text-indigo-700 mt-2">Precio para planes mensuales de noche</p>
    </div>
  </div>
</div>

// 3. Función para actualizar precios:
const updateMonthlyPlanPrice = (timeType: 'day' | 'night', value: number) => {
  if (!config) return;
  
  const updated = {
    ...config,
    monthlyPlanPrices: {
      ...config.monthlyPlanPrices,
      [timeType]: value
    }
  };
  
  setConfig(updated);
};
```

### PASO 2: Modificar MonthlySubscriptionManager

```typescript
// En MonthlySubscriptionManager.tsx

// 1. Agregar al formulario de nueva suscripción:
const [newSubscription, setNewSubscription] = useState({
  // ... campos existentes ...
  timeType: 'day' as 'day' | 'night', // NUEVO CAMPO
  amount: 0,
  // ... resto de campos ...
});

// 2. En el modal de creación, agregar selector de modalidad:
<div className="bg-white p-4 rounded-xl border-2 border-purple-200">
  <label className="block text-sm font-bold text-gray-800 mb-3">
    Modalidad del Plan
  </label>
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => {
        setNewSubscription({
          ...newSubscription,
          timeType: 'day',
          amount: config?.monthlyPlanPrices?.day || 50000
        });
      }}
      className={\`p-4 rounded-lg border-2 transition-all \${
        newSubscription.timeType === 'day'
          ? 'border-yellow-500 bg-yellow-50'
          : 'border-gray-200 hover:border-yellow-300'
      }\`}
    >
      <div className="text-3xl mb-2">☀️</div>
      <div className="font-semibold">Diurno</div>
      <div className="text-sm text-gray-600">
        \${(config?.monthlyPlanPrices?.day || 0).toLocaleString()}
      </div>
    </button>

    <button
      type="button"
      onClick={() => {
        setNewSubscription({
          ...newSubscription,
          timeType: 'night',
          amount: config?.monthlyPlanPrices?.night || 40000
        });
      }}
      className={\`p-4 rounded-lg border-2 transition-all \${
        newSubscription.timeType === 'night'
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 hover:border-indigo-300'
      }\`}
    >
      <div className="text-3xl mb-2">🌙</div>
      <div className="font-semibold">Nocturno</div>
      <div className="text-sm text-gray-600">
        \${(config?.monthlyPlanPrices?.night || 0).toLocaleString()}
      </div>
    </button>
  </div>
</div>

// 3. Mostrar modalidad en la lista:
<div className="flex items-center gap-2">
  {sub.timeType === 'day' ? (
    <>
      <span className="text-2xl">☀️</span>
      <span className="text-sm font-medium text-yellow-800">Diurno</span>
    </>
  ) : (
    <>
      <span className="text-2xl">🌙</span>
      <span className="text-sm font-medium text-indigo-800">Nocturno</span>
    </>
  )}
</div>
```

### PASO 3: Actualizar Base de Datos (localDatabase.ts y dualDatabase.ts)

```typescript
// En la interfaz MonthlySubscription:
export interface MonthlySubscription {
  id: string;
  vehiclePlate: string;
  vehicleType: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  subscriptionType: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  timeType: 'day' | 'night'; // NUEVO CAMPO
  customDays?: number;
  startDate: Date;
  endDate: Date;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'active' | 'expired';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PASO 4: Crear Ticket Simple para Planes Mensuales

Crear archivo: `frontend/src/components/MonthlyPlanTicket.tsx`

```typescript
import { getDualDB } from '../lib/dualDatabase';

interface MonthlyPlanTicketData {
  id: string;
  vehiclePlate: string;
  clientName: string;
  timeType: 'day' | 'night';
  amount: number;
  startDate: Date;
  endDate: Date;
}

const generateEAN13Barcode = (originalCode: string): string => {
  const numericCode = originalCode.replace(/\D/g, '');
  const timestamp = Date.now().toString();
  let code12 = (numericCode + timestamp).substring(0, 12).padStart(12, '0');
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code12 + checkDigit;
};

export const printMonthlyPlanTicket = async (data: MonthlyPlanTicketData) => {
  const dualDB = getDualDB();
  let config;
  try {
    config = await dualDB.getBusinessConfig();
  } catch (error) {
    console.error('Error cargando configuración:', error);
    config = null;
  }

  const ticketData = config?.ticketData || {
    companyName: 'WILSON CARS & WASH',
    address: 'Calle 123 #45-67, Bogotá D.C.'
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const validBarcode = generateEAN13Barcode(data.id);

    const htmlContent = \`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PLAN MENSUAL</title>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
        @media print {
            @page {
                size: 58mm auto;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 2mm;
                width: 58mm;
            }
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            background: white;
            color: black;
            width: 58mm;
            margin: 0;
            padding: 2mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: black;
            margin: 0 auto;
            text-align: center;
        }
        
        .logo-img {
            width: 90px;
            height: auto;
            margin: 5px auto 8px auto;
            display: block;
        }
        
        .company-name {
            font-size: 15px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .company-address {
            font-size: 10px;
            margin: 3px 0;
            color: #333;
        }
        
        .separator {
            border-top: 1px dashed black;
            margin: 10px 0;
        }
        
        .ticket-title {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
            letter-spacing: 0.5px;
        }
        
        .time-badge {
            display: inline-block;
            padding: 8px 16px;
            margin: 10px 0;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
        }
        
        .time-badge.day {
            background: linear-gradient(135deg, #FEF3C7, #FDE047);
            color: #92400E;
            border: 2px solid #FBBF24;
        }
        
        .time-badge.night {
            background: linear-gradient(135deg, #C7D2FE, #818CF8);
            color: #312E81;
            border: 2px solid #6366F1;
        }
        
        .info-section {
            margin: 15px 0;
            text-align: left;
        }
        
        .info-label {
            font-size: 10px;
            color: #666;
            font-weight: bold;
        }
        
        .info-value {
            font-size: 14px;
            font-weight: bold;
            margin: 3px 0 10px 0;
        }
        
        .plate-value {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 10px 0;
        }
        
        .amount-section {
            margin: 15px 0;
            padding: 10px 0;
            border-top: 2px solid black;
            border-bottom: 2px solid black;
        }
        
        .amount-label {
            font-size: 12px;
            font-weight: bold;
        }
        
        .amount-value {
            font-size: 28px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .date-section {
            margin: 10px 0;
            font-size: 11px;
        }
        
        .barcode-section {
            margin: 12px 0;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 70px;
            margin: 8px auto;
            line-height: 0.9;
        }
        
        .footer {
            font-size: 10px;
            margin-top: 10px;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Logo -->
        <img class="logo-img" src="/images/company-logo.jpg" alt="Logo" onerror="this.style.display='none'" />
        
        <!-- Nombre de la empresa -->
        <div class="company-name">\${ticketData.companyName}</div>
        <div class="company-address">\${ticketData.address}</div>
        
        <div class="separator"></div>
        
        <!-- Título -->
        <div class="ticket-title">PLAN MENSUAL</div>
        
        <!-- Badge de modalidad -->
        <div class="time-badge \${data.timeType}">
            \${data.timeType === 'day' ? '☀️ DIURNO' : '🌙 NOCTURNO'}
        </div>
        
        <div class="separator"></div>
        
        <!-- Información del plan -->
        <div class="info-section">
            <div class="info-label">PLACA DEL VEHICULO</div>
            <div class="plate-value">\${data.vehiclePlate}</div>
            
            <div class="info-label">CLIENTE</div>
            <div class="info-value">\${data.clientName}</div>
            
            <div class="date-section">
                <div><strong>Inicio:</strong> \${formatDate(data.startDate)}</div>
                <div><strong>Vence:</strong> \${formatDate(data.endDate)}</div>
            </div>
        </div>
        
        <!-- Monto -->
        <div class="amount-section">
            <div class="amount-label">Total Pagado:</div>
            <div class="amount-value">$\${data.amount.toLocaleString('es-CO')}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Código de barras -->
        <div class="barcode-section">
            <div class="barcode-visual">\${validBarcode}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-message">¡GRACIAS POR SU VISITA Y BUEN CAMINO!</div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
                window.close();
            }, 500);
        }
    </script>
</body>
</html>\`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
```

### PASO 5: Usar el nuevo ticket

En `MonthlySubscriptionManager.tsx`, importar y usar el nuevo ticket:

```typescript
import { printMonthlyPlanTicket } from './MonthlyPlanTicket';

// Al crear o imprimir un plan:
const handlePrintTicket = async (subscription: MonthlySubscription) => {
  await printMonthlyPlanTicket({
    id: subscription.id,
    vehiclePlate: subscription.vehiclePlate,
    clientName: subscription.clientName,
    timeType: subscription.timeType,
    amount: subscription.amount,
    startDate: subscription.startDate,
    endDate: subscription.endDate
  });
};
```

---

## ✅ Resumen

1. ✅ **Configuración simplificada** - Solo dirección (YA COMPLETADO)
2. ⏳ **Agregar precios día/noche** - En configuración empresarial
3. ⏳ **Modificar formulario** - Agregar selector de modalidad
4. ⏳ **Actualizar base de datos** - Campo `timeType`
5. ⏳ **Crear ticket nuevo** - Diseño simple como parqueadero

**Archivos a modificar:**
- `BusinessConfigurationPanel.tsx` (✅ Parcial - falta agregar precios)
- `MonthlySubscriptionManager.tsx`
- `localDatabase.ts`
- `dualDatabase.ts`
- **Crear nuevo**: `MonthlyPlanTicket.tsx`

---

**Fecha:** 7 de enero de 2025
**Estado:** En progreso
