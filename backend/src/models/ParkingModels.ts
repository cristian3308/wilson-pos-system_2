import mongoose from 'mongoose';

// Esquema para tipos de vehículos
const tipoVehiculoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio_hora: { type: Number, required: true },
  precio_fraccion: { type: Number, required: true },
  minutos_fraccion: { type: Number, required: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Esquema para vehículos en parqueadero
const vehiculoParqueaderoSchema = new mongoose.Schema({
  placa: { type: String, required: true, uppercase: true },
  tipo_vehiculo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoVehiculo', required: true },
  fecha_entrada: { type: Date, default: Date.now },
  fecha_salida: { type: Date },
  codigo_barras: { type: String, unique: true, required: true },
  precio_hora: { type: Number, required: true },
  precio_fraccion: { type: Number, required: true },
  minutos_fraccion: { type: Number, required: true },
  tiempo_total: { type: Number }, // en minutos
  total_pago: { type: Number },
  estado: { 
    type: String, 
    enum: ['ACTIVO', 'PAGADO', 'CANCELADO'], 
    default: 'ACTIVO' 
  },
  usuario_entrada: { type: String, default: 'sistema' },
  usuario_salida: { type: String },
  observaciones: { type: String }
}, {
  timestamps: true
});

// Esquema para servicios de lavadero
const servicioLavaderoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: Number, required: true },
  duracion_estimada: { type: Number, required: true }, // en minutos
  activo: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Esquema para órdenes de lavadero
const ordenLavaderoSchema = new mongoose.Schema({
  placa: { type: String, required: true, uppercase: true },
  tipo_vehiculo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoVehiculo', required: true },
  fecha_servicio: { type: Date, default: Date.now },
  fecha_inicio: { type: Date },
  fecha_finalizacion: { type: Date },
  codigo_barras: { type: String, unique: true, required: true },
  servicios: [{
    servicio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicioLavadero', required: true },
    cantidad: { type: Number, default: 1 },
    precio_unitario: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  total_servicios: { type: Number, required: true },
  tiempo_estimado: { type: Number }, // en minutos
  estado: { 
    type: String, 
    enum: ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO', 'CANCELADO'], 
    default: 'PENDIENTE' 
  },
  observaciones: { type: String },
  usuario: { type: String, default: 'sistema' },
  usuario_finalizacion: { type: String }
}, {
  timestamps: true
});

// Esquema para configuración del sistema
const configuracionSchema = new mongoose.Schema({
  clave: { type: String, unique: true, required: true },
  valor: { type: mongoose.Schema.Types.Mixed, required: true },
  descripcion: { type: String },
  categoria: { type: String, default: 'general' }
}, {
  timestamps: true
});

// Esquema para logs del sistema
const logSistemaSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  accion: { type: String, required: true },
  modulo: { type: String, required: true },
  descripcion: { type: String },
  datos_adicionales: { type: mongoose.Schema.Types.Mixed },
  fecha: { type: Date, default: Date.now },
  ip: { type: String }
}, {
  timestamps: true
});

// Exportar modelos
export const TipoVehiculo = mongoose.model('TipoVehiculo', tipoVehiculoSchema);
export const VehiculoParqueadero = mongoose.model('VehiculoParqueadero', vehiculoParqueaderoSchema);
export const ServicioLavadero = mongoose.model('ServicioLavadero', servicioLavaderoSchema);
export const OrdenLavadero = mongoose.model('OrdenLavadero', ordenLavaderoSchema);
export const Configuracion = mongoose.model('Configuracion', configuracionSchema);
export const LogSistema = mongoose.model('LogSistema', logSistemaSchema);