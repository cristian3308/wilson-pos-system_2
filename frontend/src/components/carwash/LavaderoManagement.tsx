import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

interface ServicioLavadero {
  id: string;
  nombre: string;
  precio: number;
  duracion: number; // minutos
  descripcion: string;
  icono: string;
}

interface OrdenLavadero {
  id: string;
  numeroOrden: string;
  barcode?: string; // ✅ NUEVO: Código de barras EAN-13
  placaVehiculo: string;
  servicios: ServicioLavadero[];
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  horaCreacion: string;
  horaInicio?: string;
  horaFinalizacion?: string;
  cliente?: {
    nombre: string;
    telefono: string;
  };
  observaciones?: string;
  total: number;
  tiempoEstimado: number;
  trabajadorAsignado?: string;
  trabajadorPorcentaje?: number; // ✅ NUEVO: % de ganancia del trabajador (ej: 60%)
}

const serviciosDisponibles: ServicioLavadero[] = [
  {
    id: '1',
    nombre: 'Lavado Básico',
    precio: 15000,
    duracion: 30,
    descripcion: 'Lavado exterior básico con agua y jabón',
    icono: '🧽'
  },
  {
    id: '2',
    nombre: 'Lavado Completo',
    precio: 25000,
    duracion: 45,
    descripcion: 'Lavado exterior e interior completo',
    icono: '✨'
  },
  {
    id: '3',
    nombre: 'Lavado Premium',
    precio: 40000,
    duracion: 60,
    descripcion: 'Lavado completo + encerado + aspirado',
    icono: '💎'
  },
  {
    id: '4',
    nombre: 'Solo Aspirado',
    precio: 8000,
    duracion: 15,
    descripcion: 'Aspirado interior del vehículo',
    icono: '🌪️'
  },
  {
    id: '5',
    nombre: 'Encerado',
    precio: 20000,
    duracion: 30,
    descripcion: 'Aplicación de cera protectora',
    icono: '🪞'
  },
  {
    id: '6',
    nombre: 'Lavado de Motor',
    precio: 18000,
    duracion: 25,
    descripcion: 'Limpieza especializada del motor',
    icono: '⚙️'
  }
];

export const LavaderoManagement: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenLavadero[]>([]);
  const [mode, setMode] = useState<'crear' | 'gestionar' | 'historial'>('crear');
  const [loading, setLoading] = useState(false);

  // ✅ NUEVO: Estado para buffer del escáner
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const barcodeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // ✅ NUEVO: Generar código de barras EAN-13 (igual que parqueadero)
  const generateBarcode = (): string => {
    const timestamp = Date.now();
    const base = timestamp.toString().slice(-12).padStart(12, '0');
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const weight = (i % 2 === 0) ? 1 : 3;
      sum += parseInt(base[i]) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  };

  // ✅ NUEVO: Manejar escaneo de código de barras
  const handleBarcodeScanned = async (barcode: string) => {
    console.log('\n========== ESCANEO LAVADERO ==========');
    console.log('🧼 Código escaneado:', barcode);

    // Buscar la orden por código de barras
    const orden = ordenes.find(o => o.barcode === barcode);

    if (!orden) {
      alert('❌ Orden no encontrada');
      return;
    }

    console.log('📋 Orden encontrada:', orden);

    // Verificar estado
    if (orden.estado === 'pendiente' || orden.estado === 'en_proceso') {
      // ❌ Todavía no está completado
      alert(`⚠️ COCHE NO LAVADO TODAVIA\n\nOrden: ${orden.numeroOrden}\nEstado: ${orden.estado}\nPlaca: ${orden.placaVehiculo}\n\nPor favor, complete el servicio primero.`);
      return;
    }

    if (orden.estado === 'completado') {
      // ✅ Está completado, generar factura
      console.log('✅ Orden completada, generando factura...');
      generarFacturaLavado(orden);
      
      // Actualizar orden para marcarla como facturada
      setOrdenes(prev => prev.map(o => 
        o.id === orden.id ? { ...o, estado: 'cancelado' as const } : o
      ));
      
      return;
    }

    if (orden.estado === 'cancelado') {
      alert('ℹ️ Esta orden ya fue facturada anteriormente');
      return;
    }
  };

  // ✅ NUEVO: Generar factura de lavado con ganancias del trabajador
  const generarFacturaLavado = (orden: OrdenLavadero) => {
    const trabajadorGanancia = Math.ceil(orden.total * ((orden.trabajadorPorcentaje || 60) / 100));
    const negocioGanancia = orden.total - trabajadorGanancia;

    // Crear contenido de la factura
    const facturaHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FACTURA LAVADERO - ${orden.numeroOrden}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            padding: 10px;
            width: 58mm;
        }
        .ticket { text-align: center; }
        .header { border-top: 3px solid black; border-bottom: 3px solid black; padding: 15px 0; margin-bottom: 18px; }
        .company-name { font-size: 21px; margin-bottom: 10px; }
        .company-subtitle { font-size: 19px; margin-bottom: 8px; }
        .nit { font-size: 16px; }
        .ticket-type { font-size: 18px; margin: 15px 0; font-weight: bold; }
        .info-line { display: flex; justify-content: space-between; margin: 8px 0; font-size: 17px; }
        .separator { border-top: 2px dashed black; margin: 15px 0; }
        .total-section { margin: 20px 0; }
        .total-label { font-size: 18px; margin-bottom: 10px; }
        .total-amount { font-size: 24px; margin: 10px 0; }
        .ganancia { font-size: 18px; margin: 8px 0; color: #2563eb; }
        .footer { margin-top: 20px; font-size: 18px; }
        .footer-message { font-weight: bold; margin-bottom: 6px; }
        .footer-info { margin: 5px 0; line-height: 1.7; }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">SERVICIO DE LAVADO</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">*** FACTURA LAVADO ***</div>
        
        <div class="info-line">
            <span>Orden:</span>
            <span>${orden.numeroOrden}</span>
        </div>
        
        <div class="info-line">
            <span>Placa:</span>
            <span>${orden.placaVehiculo}</span>
        </div>
        
        <div class="info-line">
            <span>Fecha:</span>
            <span>${new Date(orden.horaFinalizacion || orden.horaCreacion).toLocaleDateString('es-CO')}</span>
        </div>
        
        <div class="separator"></div>
        
        <div style="text-align: left; margin: 10px 0;">
            <strong>Servicios:</strong><br>
            ${orden.servicios.map(s => `${s.icono} ${s.nombre}: $${s.precio.toLocaleString('es-CO')}`).join('<br>')}
        </div>
        
        <div class="separator"></div>
        
        <div class="total-section">
            <div class="total-label">TOTAL</div>
            <div class="total-amount">$${orden.total.toLocaleString('es-CO')}</div>
            
            <div class="separator"></div>
            
            <div class="ganancia">
                💰 Trabajador (${orden.trabajadorPorcentaje || 60}%): $${trabajadorGanancia.toLocaleString('es-CO')}
            </div>
            <div class="ganancia" style="color: #16a34a;">
                🏢 Negocio (${100 - (orden.trabajadorPorcentaje || 60)}%): $${negocioGanancia.toLocaleString('es-CO')}
            </div>
        </div>
        
        <div class="separator"></div>
        
        <div class="footer">
            <div class="footer-message">GRACIAS POR SU PREFERENCIA</div>
            <div class="footer-info">
                Calle 123 #45-67, Bogotá D.C.<br>
                Tel: +57 (1) 234-5678<br>
                info@wilsoncarwash.com<br>
                Horario: 24/7 | Servicio completo
            </div>
            <div style="margin-top: 10px; font-size: 18px;">
                ${new Date().toLocaleString('es-CO')}<br>
                ID: ${orden.id.substring(0, 8)}
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
</html>
    `;

    // Abrir en nueva ventana e imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(facturaHTML);
      printWindow.document.close();
    }

    // Mostrar notificación de éxito
    alert(`✅ Factura generada!\n\n${orden.numeroOrden}\nPlaca: ${orden.placaVehiculo}\nTotal: $${orden.total.toLocaleString('es-CO')}\n\n💰 Trabajador: $${trabajadorGanancia.toLocaleString('es-CO')}\n🏢 Negocio: $${negocioGanancia.toLocaleString('es-CO')}`);
  };

  // ✅ NUEVO: Listener del teclado para detectar escaneos (LOCAL - respaldo)
  useEffect(() => {
    console.log('🧼 LAVADERO: Listener de teclado LOCAL activado (respaldo)');
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Detectar Enter (fin del escaneo)
      if (e.key === 'Enter') {
        console.log(`🧼 LAVADERO Enter detectado. Buffer length: ${barcodeBuffer.length}, contenido: "${barcodeBuffer}"`);
        
        if (barcodeBuffer.length === 13) {
          console.log('🔍 LAVADERO: Código completo de 13 dígitos:', barcodeBuffer);
          handleBarcodeScanned(barcodeBuffer);
        } else if (barcodeBuffer.length >= 10) {
          console.log('⚠️ LAVADERO: Código de longitud incorrecta, esperaba 13, recibió:', barcodeBuffer.length);
          // Intentar procesar de todos modos
          handleBarcodeScanned(barcodeBuffer);
        }
        
        setBarcodeBuffer('');
        if (barcodeTimerRef.current) {
          clearTimeout(barcodeTimerRef.current);
        }
        return;
      }

      // Acumular dígitos
      if (/^\d$/.test(e.key)) {
        const newBuffer = barcodeBuffer + e.key;
        console.log(`🧼 LAVADERO Dígito: ${e.key}, Buffer: ${newBuffer}`);
        setBarcodeBuffer(newBuffer);
        
        // Limpiar buffer después de 100ms si no hay más input
        if (barcodeTimerRef.current) {
          clearTimeout(barcodeTimerRef.current);
        }
        barcodeTimerRef.current = setTimeout(() => {
          console.log('⏱️ LAVADERO: Timeout - limpiando buffer');
          setBarcodeBuffer('');
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    
    return () => {
      console.log('🧼 LAVADERO: Listener de teclado desactivado');
      window.removeEventListener('keypress', handleKeyPress);
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, [barcodeBuffer, ordenes]);

  // Formulario de nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({
    placaVehiculo: '',
    serviciosSeleccionados: [] as string[],
    cliente: {
      nombre: '',
      telefono: ''
    },
    observaciones: ''
  });

  useEffect(() => {
    loadOrdenes();
    const interval = setInterval(loadOrdenes, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrdenes = async () => {
    try {
      const response = await apiService.getOrdenesLavadero();
      setOrdenes(response.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      // En caso de error, mantener lista vacía
      setOrdenes([]);
    }
  };

  const toggleServicio = (servicioId: string) => {
    const isSelected = nuevaOrden.serviciosSeleccionados.includes(servicioId);
    if (isSelected) {
      setNuevaOrden({
        ...nuevaOrden,
        serviciosSeleccionados: nuevaOrden.serviciosSeleccionados.filter(id => id !== servicioId)
      });
    } else {
      setNuevaOrden({
        ...nuevaOrden,
        serviciosSeleccionados: [...nuevaOrden.serviciosSeleccionados, servicioId]
      });
    }
  };

  const calcularTotal = () => {
    return nuevaOrden.serviciosSeleccionados.reduce((total, servicioId) => {
      const servicio = serviciosDisponibles.find(s => s.id === servicioId);
      return total + (servicio?.precio || 0);
    }, 0);
  };

  const calcularTiempoEstimado = () => {
    return nuevaOrden.serviciosSeleccionados.reduce((total, servicioId) => {
      const servicio = serviciosDisponibles.find(s => s.id === servicioId);
      return total + (servicio?.duracion || 0);
    }, 0);
  };

  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaOrden.serviciosSeleccionados.length === 0) {
      alert('Debe seleccionar al menos un servicio');
      return;
    }

    setLoading(true);
    try {
      const serviciosOrden = serviciosDisponibles.filter(s => 
        nuevaOrden.serviciosSeleccionados.includes(s.id)
      );

      // ✅ Generar código de barras EAN-13
      const barcode = generateBarcode();
      console.log('🔢 EAN-13 generado para orden de lavado:', barcode, `(${barcode.length} dígitos)`);
      
      // Verificar que tenga exactamente 13 dígitos
      if (barcode.length !== 13) {
        console.error('⚠️ ERROR: Código de barras no tiene 13 dígitos!');
      }

      const ordenCompleta: OrdenLavadero = {
        id: Date.now().toString(),
        numeroOrden: `LV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(ordenes.length + 1).padStart(3, '0')}`,
        barcode: barcode, // ✅ NUEVO: Guardar código de barras
        placaVehiculo: nuevaOrden.placaVehiculo.toUpperCase(),
        servicios: serviciosOrden,
        estado: 'pendiente',
        horaCreacion: new Date().toISOString(),
        cliente: nuevaOrden.cliente.nombre ? nuevaOrden.cliente : undefined,
        observaciones: nuevaOrden.observaciones,
        total: calcularTotal(),
        tiempoEstimado: calcularTiempoEstimado(),
        trabajadorPorcentaje: 60 // ✅ NUEVO: 60% para el trabajador, 40% para el negocio
      };

      setOrdenes([...ordenes, ordenCompleta]);
      
      // Limpiar formulario
      setNuevaOrden({
        placaVehiculo: '',
        serviciosSeleccionados: [],
        cliente: { nombre: '', telefono: '' },
        observaciones: ''
      });

      alert(`✅ Orden creada exitosamente!\n\nNúmero: ${ordenCompleta.numeroOrden}\nTotal: $${ordenCompleta.total.toLocaleString()}\nTiempo estimado: ${ordenCompleta.tiempoEstimado} minutos`);

    } catch (error) {
      console.error('Error al crear orden:', error);
      alert('❌ Error al crear la orden. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoOrden = async (ordenId: string, nuevoEstado: OrdenLavadero['estado']) => {
    setOrdenes(ordenes.map(orden => {
      if (orden.id === ordenId) {
        const ordenActualizada = { ...orden, estado: nuevoEstado };
        
        if (nuevoEstado === 'en_proceso' && !orden.horaInicio) {
          ordenActualizada.horaInicio = new Date().toISOString();
        } else if (nuevoEstado === 'completado' && !orden.horaFinalizacion) {
          ordenActualizada.horaFinalizacion = new Date().toISOString();
        }
        
        return ordenActualizada;
      }
      return orden;
    }));
  };

  const getEstadoColor = (estado: OrdenLavadero['estado']) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_proceso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado: OrdenLavadero['estado']) => {
    switch (estado) {
      case 'pendiente': return '⏳ Pendiente';
      case 'en_proceso': return '🔄 En Proceso';
      case 'completado': return '✅ Completado';
      case 'cancelado': return '❌ Cancelado';
      default: return estado;
    }
  };

  const renderCrearOrden = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
          <span className="text-white text-xl">✨</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Nueva Orden de Lavadero</h2>
      </div>

      <form onSubmit={handleCrearOrden} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placa del Vehículo *
            </label>
            <input
              type="text"
              value={nuevaOrden.placaVehiculo}
              onChange={(e) => setNuevaOrden({...nuevaOrden, placaVehiculo: e.target.value.toUpperCase()})}
              placeholder="Ej: ABC123"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={nuevaOrden.cliente.nombre}
              onChange={(e) => setNuevaOrden({
                ...nuevaOrden,
                cliente: { ...nuevaOrden.cliente, nombre: e.target.value }
              })}
              placeholder="Nombre del cliente (opcional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={nuevaOrden.cliente.telefono}
              onChange={(e) => setNuevaOrden({
                ...nuevaOrden,
                cliente: { ...nuevaOrden.cliente, telefono: e.target.value }
              })}
              placeholder="Número de contacto (opcional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Servicios Solicitados *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviciosDisponibles.map((servicio) => (
              <div
                key={servicio.id}
                onClick={() => toggleServicio(servicio.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  nuevaOrden.serviciosSeleccionados.includes(servicio.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{servicio.icono}</span>
                  <input
                    type="checkbox"
                    checked={nuevaOrden.serviciosSeleccionados.includes(servicio.id)}
                    onChange={() => toggleServicio(servicio.id)}
                    className="h-5 w-5 text-purple-600"
                  />
                </div>
                <h3 className="font-bold text-gray-900">{servicio.nombre}</h3>
                <p className="text-sm text-gray-600 mb-2">{servicio.descripcion}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-green-600">${servicio.precio.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">{servicio.duracion} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={nuevaOrden.observaciones}
            onChange={(e) => setNuevaOrden({...nuevaOrden, observaciones: e.target.value})}
            placeholder="Observaciones especiales (opcional)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {nuevaOrden.serviciosSeleccionados.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">Resumen de la Orden</h3>
            <div className="flex justify-between items-center">
              <span>Total a pagar:</span>
              <span className="text-2xl font-bold text-green-600">
                ${calcularTotal().toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tiempo estimado:</span>
              <span className="font-bold text-blue-600">
                {calcularTiempoEstimado()} minutos
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !nuevaOrden.placaVehiculo || nuevaOrden.serviciosSeleccionados.length === 0}
          className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
        >
          {loading ? '⏳ Creando Orden...' : '✨ Crear Orden de Lavadero'}
        </button>
      </form>
    </div>
  );

  const renderGestionar = () => {
    const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente');
    const ordenesEnProceso = ordenes.filter(o => o.estado === 'en_proceso');
    const ordenesCompletadas = ordenes.filter(o => o.estado === 'completado');

    return (
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⏳</span>
              <div>
                <p className="text-sm text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-800">{ordenesPendientes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔄</span>
              <div>
                <p className="text-sm text-blue-600">En Proceso</p>
                <p className="text-2xl font-bold text-blue-800">{ordenesEnProceso.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="text-sm text-green-600">Completadas Hoy</p>
                <p className="text-2xl font-bold text-green-800">{ordenesCompletadas.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <p className="text-sm text-purple-600">Ingresos Hoy</p>
                <p className="text-xl font-bold text-purple-800">
                  ${ordenesCompletadas.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de órdenes activas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Órdenes Activas</h3>
          
          {[...ordenesPendientes, ...ordenesEnProceso].length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-600">No hay órdenes activas en este momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...ordenesPendientes, ...ordenesEnProceso].map((orden) => (
                <div key={orden.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{orden.numeroOrden}</h4>
                      <p className="text-gray-600">Placa: {orden.placaVehiculo}</p>
                      {orden.cliente && (
                        <p className="text-sm text-gray-500">
                          Cliente: {orden.cliente.nombre} • {orden.cliente.telefono}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(orden.estado)}`}>
                      {getEstadoTexto(orden.estado)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Servicios:</p>
                      <div className="flex flex-wrap gap-1">
                        {orden.servicios.map((servicio, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {servicio.icono} {servicio.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total:</p>
                      <p className="text-lg font-bold text-green-600">${orden.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tiempo estimado:</p>
                      <p className="font-medium">{orden.tiempoEstimado} min</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {orden.estado === 'pendiente' && (
                      <button
                        onClick={() => cambiarEstadoOrden(orden.id, 'en_proceso')}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        🔄 Iniciar Trabajo
                      </button>
                    )}
                    {orden.estado === 'en_proceso' && (
                      <button
                        onClick={() => cambiarEstadoOrden(orden.id, 'completado')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        ✅ Marcar Completado
                      </button>
                    )}
                    <button
                      onClick={() => cambiarEstadoOrden(orden.id, 'cancelado')}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistorial = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Historial de Órdenes</h3>
      
      {ordenes.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600">No hay órdenes registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Servicios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{orden.numeroOrden}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{orden.placaVehiculo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {orden.cliente?.nombre || 'Sin registrar'}
                    </div>
                    {orden.cliente?.telefono && (
                      <div className="text-sm text-gray-500">{orden.cliente.telefono}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {orden.servicios.map((servicio, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {servicio.icono} {servicio.nombre}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      ${orden.total.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(orden.estado)}`}>
                      {getEstadoTexto(orden.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(orden.horaCreacion).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md p-1">
        <nav className="flex space-x-1">
          <button
            onClick={() => setMode('crear')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
              mode === 'crear'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✨ Nueva Orden
          </button>
          <button
            onClick={() => setMode('gestionar')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
              mode === 'gestionar'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔄 Gestionar Órdenes
          </button>
          <button
            onClick={() => setMode('historial')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
              mode === 'historial'
                ? 'bg-purple-500 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 Historial
          </button>
        </nav>
      </div>

      {/* Content */}
      {mode === 'crear' && renderCrearOrden()}
      {mode === 'gestionar' && renderGestionar()}
      {mode === 'historial' && renderHistorial()}
    </div>
  );
};