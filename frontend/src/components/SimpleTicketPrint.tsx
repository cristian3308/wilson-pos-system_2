// Componente para generar tickets de parking simples y profesionales
// Similar al diseño de la imagen de referencia

import { getDualDB } from '../lib/dualDatabase';

interface TicketData {
  id: string;
  barcode: string;
  placa: string;
  vehicleType: string;
  fechaEntrada?: Date;
  fechaSalida?: Date;
  tiempoTotal?: string;
  valorPagar?: number;
  entryTime?: Date;
  exitTime?: Date;
  totalMinutes?: number;
  totalAmount?: number;
  estado: 'activo' | 'pagado';
}

interface VehicleType {
  name: string;
  tarifa: number;
}

interface PrintData {
  type: 'entry' | 'exit';
  ticket: TicketData;
  vehicleType?: VehicleType;
}

// Función auxiliar para generar código de barras EAN-13 válido (solo números)
const generateEAN13Barcode = (originalCode: string): string => {
  // Convertir el código a números eliminando caracteres no numéricos
  const numericCode = originalCode.replace(/\D/g, '');
  
  // Tomar timestamp para asegurar unicidad
  const timestamp = Date.now().toString();
  
  // Combinar y tomar los primeros 12 dígitos
  let code12 = (numericCode + timestamp).substring(0, 12).padStart(12, '0');
  
  // Calcular dígito verificador EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code12 + checkDigit;
};

export const printSimpleTicket = async (data: PrintData) => {
  // Obtener configuración
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
    address: 'Calle 123 #45-67, Bogotá D.C.',
    phone: '+57 (1) 234-5678'
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const entryTime = data.ticket.fechaEntrada || data.ticket.entryTime || new Date();
    const exitTime = data.ticket.fechaSalida || data.ticket.exitTime;
    
    const formatTime = (date: Date) => {
      return new Date(date).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase();
    };

    // Convertir barcode a formato EAN-13 válido
    const validBarcode = generateEAN13Barcode(data.ticket.barcode || data.ticket.id);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PARKING TICKET</title>
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
        
        .date-large {
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .time-section {
            margin: 12px 0;
        }
        
        .time-row {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 8px 0;
            gap: 8px;
        }
        
        .car-icon {
            font-size: 20px;
        }
        
        .arrow-icon {
            font-size: 16px;
            margin: 0 5px;
        }
        
        .time-info {
            text-align: left;
        }
        
        .time-label {
            font-size: 10px;
            font-weight: bold;
        }
        
        .time-value {
            font-size: 12px;
        }
        
        .plate-section {
            margin: 12px 0;
        }
        
        .plate-label {
            font-size: 11px;
        }
        
        .plate-value {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 5px 0;
        }
        
        .total-section {
            margin: 12px 0;
            padding: 8px 0;
            border-top: 2px solid black;
            border-bottom: 2px solid black;
        }
        
        .total-label {
            font-size: 12px;
            font-weight: bold;
        }
        
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .barcode-section {
            margin: 12px 0;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 170px;
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
        <div class="company-name">${ticketData.companyName}</div>
        <div class="company-address">${ticketData.address}</div>
        
        <div class="separator"></div>
        
        <!-- Título del ticket -->
        <div class="ticket-title">
            ${data.type === 'entry' ? 'TICKET DE ENTRADA' : 'COMPROBANTE DE PAGO'}
        </div>
        
        <!-- Fecha grande -->
        <div class="date-large">${currentDate}</div>
        
        <div class="separator"></div>
        
        <!-- Sección de tiempos con iconos de carro -->
        <div class="time-section">
            <!-- Hora de entrada -->
            <div class="time-row">
                <div class="car-icon">🚗</div>
                <div class="arrow-icon">→</div>
                <div class="time-info">
                    <div class="time-label">ENTRADA: ${formatTime(entryTime)}</div>
                    <div class="plate-label">PLACA DEL VEHÍCULO</div>
                </div>
            </div>
            
            ${data.type === 'exit' && exitTime ? `
            <!-- Hora de salida -->
            <div class="time-row">
                <div class="time-label">SALIDA: ${formatTime(new Date(exitTime))}</div>
                <div class="arrow-icon">→</div>
                <div class="car-icon">🚗</div>
            </div>
            ` : ''}
        </div>
        
        <!-- Placa -->
        <div class="plate-section">
            <div class="plate-value">${data.ticket.placa}</div>
        </div>
        
        ${data.type === 'exit' && exitTime ? `
        <!-- Tiempo transcurrido -->
        <div class="plate-section" style="margin: 8px 0;">
            <div class="plate-label">⏱️ TIEMPO TOTAL</div>
            <div style="font-size: 16px; font-weight: bold; margin: 5px 0;">
                ${data.ticket.tiempoTotal || (() => {
                    const totalMins = data.ticket.totalMinutes || 0;
                    const hours = Math.floor(totalMins / 60);
                    const mins = totalMins % 60;
                    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
                })()}
            </div>
        </div>
        ` : ''}
        
        ${data.type === 'exit' ? `
        <!-- Total a pagar -->
        <div class="total-section">
            <div class="total-label">Total Pagado:</div>
            <div class="total-amount">$${(data.ticket.totalAmount || data.ticket.valorPagar || 0).toLocaleString('es-CO')}</div>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <!-- Código de barras -->
        <div class="barcode-section">
            <div class="barcode-visual">${validBarcode}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-message">
                ¡GRACIAS POR SU VISITA Y BUEN CAMINO!
            </div>
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
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};

// Función para tickets de lavadero (adaptada al mismo estilo)
export const printSimpleCarwashTicket = async (transaction: any) => {
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
    address: 'Calle 123 #45-67, Bogotá D.C.',
    phone: '+57 (1) 234-5678'
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const startTime = transaction.startTime || new Date();
    const endTime = transaction.endTime;
    
    const formatTime = (date: Date) => {
      return new Date(date).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase();
    };

    // Usar la función global para generar código de barras válido
    const validBarcode = generateEAN13Barcode(transaction.id || 'CW' + Date.now());

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CARWASH TICKET</title>
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
        
        .date-large {
            font-size: 12px;
            font-weight: bold;
            margin: 8px 0;
        }
        
        .service-info {
            margin: 12px 0;
            font-size: 12px;
        }
        
        .service-name {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .worker-info {
            font-size: 11px;
            margin: 5px 0;
        }
        
        .time-row {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 8px 0;
            gap: 8px;
        }
        
        .car-icon {
            font-size: 20px;
        }
        
        .time-label {
            font-size: 10px;
            font-weight: bold;
        }
        
        .time-value {
            font-size: 12px;
        }
        
        .plate-value {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 8px 0;
        }
        
        .total-section {
            margin: 12px 0;
            padding: 8px 0;
            border-top: 2px solid black;
            border-bottom: 2px solid black;
        }
        
        .total-label {
            font-size: 12px;
            font-weight: bold;
        }
        
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .barcode-section {
            margin: 12px 0;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 170px;
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
        <div class="company-name">${ticketData.companyName}</div>
        <div class="company-address">${ticketData.address}</div>
        
        <div class="separator"></div>
        
        <!-- Título del ticket -->
        <div class="ticket-title">
            ${transaction.status === 'completed' ? 'COMPROBANTE DE LAVADO' : 'ORDEN DE SERVICIO'}
        </div>
        
        <!-- Fecha grande -->
        <div class="date-large">${currentDate}</div>
        
        <div class="separator"></div>
        
        <!-- Información del servicio -->
        <div class="service-info">
            <div class="service-name">${transaction.serviceName}</div>
            <div class="worker-info">Trabajador: ${transaction.workerName}</div>
        </div>
        
        <!-- Placa -->
        <div class="plate-value">${transaction.placa}</div>
        
        <!-- Tiempos -->
        <div class="time-row">
            <div class="car-icon">🧼</div>
            <div class="time-label">INICIO: ${formatTime(startTime)}</div>
        </div>
        
        ${transaction.status === 'completed' && endTime ? `
        <div class="time-row">
            <div class="car-icon">✨</div>
            <div class="time-label">FIN: ${formatTime(new Date(endTime))}</div>
        </div>
        ` : ''}
        
        ${transaction.status === 'completed' ? `
        <!-- Total a pagar -->
        <div class="total-section">
            <div class="total-label">Pagado:</div>
            <div class="total-amount">$${(transaction.basePrice || 0).toLocaleString('es-CO')}</div>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <!-- Código de barras -->
        <div class="barcode-section">
            <div class="barcode-visual">${validBarcode}</div>
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
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
