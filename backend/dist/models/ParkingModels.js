"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogSistema = exports.Configuracion = exports.OrdenLavadero = exports.ServicioLavadero = exports.VehiculoParqueadero = exports.TipoVehiculo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const tipoVehiculoSchema = new mongoose_1.default.Schema({
    nombre: { type: String, required: true },
    precio_hora: { type: Number, required: true },
    precio_fraccion: { type: Number, required: true },
    minutos_fraccion: { type: Number, required: true },
    activo: { type: Boolean, default: true }
}, {
    timestamps: true
});
const vehiculoParqueaderoSchema = new mongoose_1.default.Schema({
    placa: { type: String, required: true, uppercase: true },
    tipo_vehiculo_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'TipoVehiculo', required: true },
    fecha_entrada: { type: Date, default: Date.now },
    fecha_salida: { type: Date },
    codigo_barras: { type: String, unique: true, required: true },
    precio_hora: { type: Number, required: true },
    precio_fraccion: { type: Number, required: true },
    minutos_fraccion: { type: Number, required: true },
    tiempo_total: { type: Number },
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
const servicioLavaderoSchema = new mongoose_1.default.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    precio: { type: Number, required: true },
    duracion_estimada: { type: Number, required: true },
    activo: { type: Boolean, default: true }
}, {
    timestamps: true
});
const ordenLavaderoSchema = new mongoose_1.default.Schema({
    placa: { type: String, required: true, uppercase: true },
    tipo_vehiculo_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'TipoVehiculo', required: true },
    fecha_servicio: { type: Date, default: Date.now },
    fecha_inicio: { type: Date },
    fecha_finalizacion: { type: Date },
    codigo_barras: { type: String, unique: true, required: true },
    servicios: [{
            servicio_id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'ServicioLavadero', required: true },
            cantidad: { type: Number, default: 1 },
            precio_unitario: { type: Number, required: true },
            subtotal: { type: Number, required: true }
        }],
    total_servicios: { type: Number, required: true },
    tiempo_estimado: { type: Number },
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
const configuracionSchema = new mongoose_1.default.Schema({
    clave: { type: String, unique: true, required: true },
    valor: { type: mongoose_1.default.Schema.Types.Mixed, required: true },
    descripcion: { type: String },
    categoria: { type: String, default: 'general' }
}, {
    timestamps: true
});
const logSistemaSchema = new mongoose_1.default.Schema({
    usuario: { type: String, required: true },
    accion: { type: String, required: true },
    modulo: { type: String, required: true },
    descripcion: { type: String },
    datos_adicionales: { type: mongoose_1.default.Schema.Types.Mixed },
    fecha: { type: Date, default: Date.now },
    ip: { type: String }
}, {
    timestamps: true
});
exports.TipoVehiculo = mongoose_1.default.model('TipoVehiculo', tipoVehiculoSchema);
exports.VehiculoParqueadero = mongoose_1.default.model('VehiculoParqueadero', vehiculoParqueaderoSchema);
exports.ServicioLavadero = mongoose_1.default.model('ServicioLavadero', servicioLavaderoSchema);
exports.OrdenLavadero = mongoose_1.default.model('OrdenLavadero', ordenLavaderoSchema);
exports.Configuracion = mongoose_1.default.model('Configuracion', configuracionSchema);
exports.LogSistema = mongoose_1.default.model('LogSistema', logSistemaSchema);
//# sourceMappingURL=ParkingModels.js.map