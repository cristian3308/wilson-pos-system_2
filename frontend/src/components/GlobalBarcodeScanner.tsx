'use client';

import { useEffect, useState } from 'react';
import { getDualDB } from '../lib/dualDatabase';
import { apiService } from '../services/api';
import { appEvents, APP_EVENTS } from '../lib/eventEmitter';

interface GlobalBarcodeScannerProps {
  onParkingScan?: (barcode: string) => void;
  onCarwashScan?: (barcode: string) => void;
}

export const GlobalBarcodeScanner: React.FC<GlobalBarcodeScannerProps> = ({
  onParkingScan,
  onCarwashScan
}) => {
  const [notification, setNotification] = useState('');

  // ✅ Función para generar ticket de cobro - IMPRIME EN EL MISMO DOCUMENTO (iframe)
  const generarFacturaLavado = async (orden: any) => {
    // 🔒 Calcular ganancias SOLO para registro interno (no se muestra en ticket)
    const trabajadorGanancia = Math.ceil(orden.total * ((orden.trabajadorPorcentaje || 60) / 100));
    const negocioGanancia = orden.total - trabajadorGanancia;
    
    console.log('💰 Distribución interna (no impresa):');
    console.log(`   👨‍🔧 Trabajador: $${trabajadorGanancia.toLocaleString('es-CO')}`);
    console.log(`   🏢 Negocio: $${negocioGanancia.toLocaleString('es-CO')}`);

    const fechaCreacion = new Date(orden.horaCreacion);
    const fechaFinalizacion = new Date(orden.horaFinalizacion || new Date());
    const startDate = fechaCreacion.toLocaleDateString('es-CO');
    const startTime = fechaCreacion.toLocaleTimeString('es-CO');
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');

    // ✅ Contenido de la factura SIN distribución de ganancias (como ticket original)
    const facturaHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>WILSON CARS & WASH - Factura de Cobro</title>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page {
            size: 58mm auto;
            margin: 0;
        }
        
        body {
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 18px;
            font-weight: bold;
            background: white;
            color: #000;
            line-height: 2.0;
            width: 58mm;
            margin: 0 auto;
            padding: 2mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: #000;
        }
        
        .logo {
            max-width: 45mm;
            width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 5px auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 18px;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
        }
        
        .company-name {
            font-size: 21px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        .company-subtitle {
            font-size: 19px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        .nit {
            font-size: 17px;
            font-weight: bold;
            line-height: 1.7;
        }
        
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 22px;
            margin: 18px 0;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
            line-height: 1.7;
        }
        
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 17px;
            line-height: 2.0;
            font-weight: bold;
        }
        
        .label {
            font-weight: bold;
        }
        
        .value {
            text-align: right;
            font-weight: bold;
        }
        
        .separator {
            border-top: 4px solid #000;
            margin: 15px 0;
        }
        
        .service-section {
            text-align: center;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
            margin: 18px 0;
        }
        
        .service-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        .service-price {
            font-size: 22px;
            font-weight: bold;
            margin: 6px 0;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            margin-top: 18px;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 18px;
            line-height: 1.8;
        }
        
        .footer-info {
            margin: 8px 0;
            line-height: 1.8;
            font-size: 15px;
            font-weight: bold;
            text-align: center;
        }
        
        @media print {
            body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .logo {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">SERVICIO DE LAVADO</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">
            💵 FACTURA DE COBRO 💵
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">Fecha:</span>
            <span class="value">${startDate}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Hora:</span>
            <span class="value">${startTime}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">Placa:</span>
            <span class="value" style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">${orden.placaVehiculo}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="service-section">
            <div class="service-name">${orden.servicios[0]?.nombre || 'Servicio de Lavado'}</div>
            <div class="service-price">$${orden.total.toLocaleString('es-CO')}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="footer">
            <div class="footer-message">✅ SERVICIO COMPLETADO</div>
            <div class="footer-message">GRACIAS POR SU PREFERENCIA</div>
            <div class="footer-info">
                Calle 123 #45-67, Bogotá D.C.
            </div>
            <div class="footer-info">
                info@wilsoncarwash.com | Tel: +57 (1) 234-5678
            </div>
            <div class="footer-info">
                Horario: 24/7 | Servicio completo
            </div>
            <div class="footer-info" style="margin-top: 10mm;">
                Ticket: ${currentDate} - ${currentTime}
            </div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>
    `;

    // ✅ Imprimir en el mismo documento usando iframe (como en parqueadero)
    console.log('🖨️ Creando iframe para impresión...');
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(facturaHTML);
      iframeDoc.close();
      
      console.log('📄 HTML escrito en iframe, esperando carga...');
      
      // ⏳ ESPERAR a que el iframe cargue ANTES de imprimir
      iframe.onload = () => {
        console.log('✅ Iframe cargado, iniciando impresión...');
        setTimeout(() => {
          iframe.contentWindow?.print();
          console.log('🖨️ Comando de impresión enviado');
        }, 500);
      };
      
      // Limpiar el iframe después de 3 segundos
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          console.log('🗑️ Iframe removido');
        }
      }, 3000);
    }

    // ℹ️ TODO: Actualizar estado de la orden a 'cancelado' en el backend
    // Por ahora solo genera el ticket, la actualización se hará manualmente

    // Mostrar notificación de éxito en consola
    console.log(`✅ TICKET DE COBRO GENERADO:`);
    console.log(`   💵 Total: $${orden.total.toLocaleString('es-CO')}`);
    console.log(`   💰 Trabajador (${orden.trabajadorPorcentaje || 60}%): $${trabajadorGanancia.toLocaleString('es-CO')}`);
    console.log(`   🏢 Negocio (${100 - (orden.trabajadorPorcentaje || 60)}%): $${negocioGanancia.toLocaleString('es-CO')}`);
  };

  useEffect(() => {
    console.log('🌐 GLOBAL: Escáner activado (parqueadero + lavadero)');
    let barcodeBuffer = '';
    let barcodeTimeout: NodeJS.Timeout | null = null;

    const handleKeyPress = async (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Si presiona Enter y hay un código completo
      if (e.key === 'Enter' && barcodeBuffer.length >= 10) {
        const scannedCode = barcodeBuffer;
        console.log('🔍 GLOBAL - Código escaneado:', scannedCode, `(${scannedCode.length} dígitos)`);
        
        // Limpiar buffer
        barcodeBuffer = '';
        
        // ✅ Buscar en AMBOS sistemas: parqueadero Y lavadero
        try {
          const dualDB = getDualDB();
          
          // 1️⃣ Buscar en PARQUEADERO (IndexedDB)
          console.log('🔍 Buscando en parqueadero...');
          const parkingTickets = await dualDB.getParkingTickets();
          const parkingTicket = parkingTickets.find((t: any) => 
            t.barcode === scannedCode && t.status === 'active'
          );

          if (parkingTicket) {
            console.log('✅ 🚗 Ticket de PARQUEADERO encontrado:', parkingTicket);
            setNotification('🚗 Ticket de parqueadero');
            setTimeout(() => setNotification(''), 2000);
            
            if (onParkingScan) {
              onParkingScan(scannedCode);
            }
            return;
          }

          // 2️⃣ Buscar en LAVADERO (IndexedDB local)
          console.log('🔍 Buscando en lavadero (IndexedDB)...');
          const carwashOrders = await dualDB.getAllCarwashTransactions();
          
          // 🐛 DEBUG: Mostrar todos los códigos de barras disponibles
          console.log('📋 Total órdenes en lavadero:', carwashOrders.length);
          carwashOrders.forEach((o: any, idx: number) => {
            const numero = o.transactionNumber || o.numeroOrden || o.ticketId || 'Sin número';
            const placa = o.vehiclePlate || o.placa || 'Sin placa';
            console.log(`   ${idx + 1}. Orden ${numero} (${placa}) - Barcode: "${o.barcode}" (${o.barcode?.length || 0} dígitos) - Estado: ${o.status || o.estado}`);
          });
          
          // Buscar por coincidencia exacta O parcial (últimos 12 dígitos)
          const carwashOrder = carwashOrders.find((o: any) => {
            if (!o.barcode) return false;
            
            // Coincidencia exacta
            if (o.barcode === scannedCode) return true;
            
            // Coincidencia con últimos 12 dígitos (si el guardado tiene 13)
            if (o.barcode.length === 13 && scannedCode.length === 12) {
              // Comparar los últimos 12 dígitos del guardado con el escaneado
              return o.barcode.slice(1) === scannedCode || o.barcode.slice(0, 12) === scannedCode;
            }
            
            // Coincidencia al revés (si escaneado tiene 13 y guardado tiene 12)
            if (o.barcode.length === 12 && scannedCode.length === 13) {
              return scannedCode.slice(1) === o.barcode || scannedCode.slice(0, 12) === o.barcode;
            }
            
            // Coincidencia flexible: si uno contiene al otro
            if (o.barcode.includes(scannedCode) || scannedCode.includes(o.barcode)) {
              console.log(`🔍 Coincidencia flexible encontrada: "${o.barcode}" vs "${scannedCode}"`);
              return true;
            }
            
            return false;
          });

          if (carwashOrder) {
            console.log('✅ 🧼 Orden de LAVADERO encontrada:', carwashOrder);
            
            // Normalizar campos (IndexedDB usa 'status', no 'estado')
            const status = carwashOrder.status || carwashOrder.estado;
            const numeroOrden = carwashOrder.transactionNumber || carwashOrder.numeroOrden;
            const placa = carwashOrder.vehiclePlate || carwashOrder.placaVehiculo;
            const total = carwashOrder.totalAmount || carwashOrder.total;
            const servicios = carwashOrder.services || carwashOrder.servicios || [];
            
            // Validar estado
            if (status === 'pending' || status === 'pendiente') {
              console.log('⚠️ Orden PENDIENTE - no ha iniciado el lavado');
              setNotification('⚠️ COCHE NO LAVADO');
              setTimeout(() => setNotification(''), 3000);
              alert(`⚠️ COCHE NO LAVADO TODAVIA\n\nOrden: ${numeroOrden}\nEstado: PENDIENTE\nPlaca: ${placa}\n\nPor favor, inicie el servicio primero.`);
              return;
            }

            // 🔥 SI ESTÁ EN PROCESO → COMPLETAR Y GENERAR TICKET AUTOMÁTICAMENTE
            if (status === 'in_progress' || status === 'en_proceso') {
              console.log('🚀 Orden EN PROCESO → Marcando como COMPLETADA y generando TICKET...');
              setNotification('✅ Completando servicio...');
              
              // 1️⃣ PRIMERO: Marcar como completada
              const orderToComplete = {
                ...carwashOrder,
                status: 'completed',
                completedAt: new Date(),
                endTime: new Date()
              };
              await dualDB.updateCarwashTransaction(orderToComplete);
              console.log('✅ Orden marcada como COMPLETADA');
              
              // 2️⃣ SEGUNDO: Generar ticket de cobro
              const ordenNormalizada = {
                id: carwashOrder.id,
                numeroOrden: numeroOrden || carwashOrder.ticketId,
                placaVehiculo: placa,
                total: total || carwashOrder.basePrice,
                servicios: servicios.length > 0 ? servicios : [{
                  nombre: carwashOrder.serviceName || 'Servicio',
                  precio: carwashOrder.basePrice || 0,
                  icono: '🧼'
                }],
                horaCreacion: carwashOrder.createdAt || carwashOrder.startTime || carwashOrder.horaCreacion,
                horaFinalizacion: new Date(),
                trabajadorPorcentaje: carwashOrder.workerPercentage || 60
              };
              
              await generarFacturaLavado(ordenNormalizada);
              
              // 3️⃣ TERCERO: Orden ya está marcada como 'completed' - NO cambiar a 'cancelled'
              console.log('✅ Orden completada y ticket generado');
              
              // 🔄 Actualizar interfaz suavemente (sin recargar página)
              setNotification('✅ Orden completada!');
              setTimeout(() => {
                setNotification('');
                // 🔔 Emitir evento para actualizar componentes
                appEvents.emit(APP_EVENTS.CARWASH_ORDER_UPDATED, scannedCode);
                console.log('📢 Evento CARWASH_ORDER_UPDATED emitido');
              }, 1500);
              
              return;
            }

            if (status === 'completed' || status === 'completado') {
              console.log('✅ Orden completada, generando TICKET DE COBRO...');
              console.log('🔍 Orden ANTES de actualizar:', JSON.stringify(carwashOrder, null, 2));
              setNotification('💵 Generando ticket de cobro...');
              setTimeout(() => setNotification(''), 2000);
              
              // Preparar objeto normalizado para la factura
              const ordenNormalizada = {
                id: carwashOrder.id,
                numeroOrden: numeroOrden || carwashOrder.ticketId,
                placaVehiculo: placa,
                total: total || carwashOrder.basePrice,
                servicios: servicios.length > 0 ? servicios : [{
                  nombre: carwashOrder.serviceName || 'Servicio',
                  precio: carwashOrder.basePrice || 0,
                  icono: '🧼'
                }],
                horaCreacion: carwashOrder.createdAt || carwashOrder.startTime || carwashOrder.horaCreacion,
                horaFinalizacion: carwashOrder.endTime || carwashOrder.completedAt || carwashOrder.horaFinalizacion || new Date(),
                trabajadorPorcentaje: carwashOrder.workerPercentage || 60
              };
              
              // ✅ Generar ticket de cobro
              await generarFacturaLavado(ordenNormalizada);
              
              // ✅ Orden se mantiene como 'completed' para aparecer en el dashboard
              console.log('✅ Ticket generado para orden completada');
              
              // 🔄 Actualizar interfaz suavemente (sin recargar página)
              setNotification('✅ Ticket generado!');
              setTimeout(() => {
                setNotification('');
                // 🔔 Emitir evento para actualizar componentes
                appEvents.emit(APP_EVENTS.CARWASH_ORDER_UPDATED, scannedCode);
                console.log('📢 Evento CARWASH_ORDER_UPDATED emitido');
              }, 1500);
              
              return;
            }

            if (status === 'cancelled' || status === 'cancelado') {
              console.log('ℹ️ Orden ya completada');
              setNotification('ℹ️ Ya completada');
              setTimeout(() => setNotification(''), 2000);
              alert('ℹ️ Esta orden ya fue completada anteriormente');
              return;
            }
          }

          // ❌ No encontrado en ningún sistema
          console.log('❌ Código no encontrado en parqueadero ni lavadero');
          setNotification('❌ Código no encontrado');
          setTimeout(() => setNotification(''), 3000);
          
        } catch (error) {
          console.error('❌ Error buscando código:', error);
          setNotification('❌ Error al buscar');
          setTimeout(() => setNotification(''), 3000);
        }
        
        return;
      }

      // Acumular dígitos
      if (/^\d$/.test(e.key)) {
        barcodeBuffer += e.key;
        
        // Reset timeout
        if (barcodeTimeout) {
          clearTimeout(barcodeTimeout);
        }
        
        barcodeTimeout = setTimeout(() => {
          barcodeBuffer = '';
        }, 100);
      }
    };

    // Registrar listener global
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      console.log('🌐 GLOBAL: Escáner desactivado');
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimeout) {
        clearTimeout(barcodeTimeout);
      }
    };
  }, [onParkingScan, onCarwashScan]);

  return (
    <>
      {notification && (
        <div className="fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {notification}
        </div>
      )}
    </>
  );
};
