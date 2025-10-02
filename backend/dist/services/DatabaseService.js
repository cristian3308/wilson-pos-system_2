"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
const sqlite3_1 = require("sqlite3");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../utils/logger"));
class DatabaseService {
    constructor() {
        this.db = null;
        this.initializeDatabase();
    }
    initializeDatabase() {
        const dbDir = path_1.default.join(__dirname, '../database');
        if (!fs_1.default.existsSync(dbDir)) {
            fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        const dbPath = path_1.default.join(dbDir, 'pos_system.db');
        this.db = new sqlite3_1.Database(dbPath, (err) => {
            if (err) {
                logger_1.default.error('Error opening database:', err);
            }
            else {
                logger_1.default.info('Connected to SQLite database');
                this.createTables();
            }
        });
    }
    createTables() {
        if (!this.db)
            return;
        this.db.run(`
      CREATE TABLE IF NOT EXISTS empresa_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL DEFAULT 'POS System',
        direccion TEXT DEFAULT '',
        telefono TEXT DEFAULT '',
        email TEXT DEFAULT '',
        logo_path TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS tipos_vehiculos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT DEFAULT '',
        tarifa_hora DECIMAL(10,2) DEFAULT 2000,
        tarifa_dia DECIMAL(10,2) DEFAULT 15000,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS espacios_parqueadero (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        tipo_vehiculo_id INTEGER,
        estado TEXT DEFAULT 'DISPONIBLE' CHECK(estado IN ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO')),
        observaciones TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculos(id)
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS vehiculos_parqueadero (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placa TEXT NOT NULL,
        tipo_vehiculo_id INTEGER NOT NULL,
        propietario TEXT DEFAULT '',
        telefono TEXT DEFAULT '',
        espacio_id INTEGER,
        fecha_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_salida DATETIME NULL,
        codigo_barras TEXT UNIQUE,
        tarifa_aplicada DECIMAL(10,2) DEFAULT 0,
        total_pagar DECIMAL(10,2) DEFAULT 0,
        metodo_pago TEXT DEFAULT '',
        estado TEXT DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO')),
        observaciones TEXT DEFAULT '',
        usuario TEXT DEFAULT 'sistema',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculos(id),
        FOREIGN KEY (espacio_id) REFERENCES espacios_parqueadero(id)
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS servicios_lavadero (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT DEFAULT '',
        precio DECIMAL(10,2) NOT NULL,
        duracion_minutos INTEGER DEFAULT 30,
        activo BOOLEAN DEFAULT 1,
        categoria TEXT DEFAULT 'general',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS ordenes_lavadero (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_orden TEXT NOT NULL UNIQUE,
        placa TEXT NOT NULL,
        tipo_vehiculo_id INTEGER NOT NULL,
        propietario TEXT DEFAULT '',
        telefono TEXT DEFAULT '',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_inicio DATETIME NULL,
        fecha_finalizacion DATETIME NULL,
        total DECIMAL(10,2) DEFAULT 0,
        metodo_pago TEXT DEFAULT '',
        estado TEXT DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'CANCELADO')),
        observaciones TEXT DEFAULT '',
        usuario TEXT DEFAULT 'sistema',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculos(id)
      )
    `);
        this.db.run(`
      CREATE TABLE IF NOT EXISTS orden_servicios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orden_id INTEGER NOT NULL,
        servicio_id INTEGER NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (orden_id) REFERENCES ordenes_lavadero(id),
        FOREIGN KEY (servicio_id) REFERENCES servicios_lavadero(id)
      )
    `);
        this.insertInitialData();
    }
    insertInitialData() {
        if (!this.db)
            return;
        this.db.run(`
      INSERT OR IGNORE INTO tipos_vehiculos (nombre, descripcion, tarifa_hora, tarifa_dia) VALUES
      ('Carro', 'Automóvil estándar', 2000, 15000),
      ('Moto', 'Motocicleta', 1000, 8000),
      ('Bicicleta', 'Bicicleta', 500, 3000)
    `);
        this.db.run(`
      INSERT OR IGNORE INTO servicios_lavadero (nombre, descripcion, precio, duracion_minutos, categoria) VALUES
      ('Lavado Básico', 'Lavado exterior básico con agua y jabón', 8000, 30, 'basico'),
      ('Lavado Completo', 'Lavado completo exterior e interior', 15000, 60, 'completo'),
      ('Encerado', 'Aplicación de cera protectora', 12000, 45, 'premium'),
      ('Aspirado', 'Aspirado completo del interior', 5000, 20, 'basico')
    `);
        this.db.run(`
      INSERT OR IGNORE INTO empresa_config (nombre, direccion, telefono, email) 
      VALUES ('POS Professional', 'Dirección Principal', '+57 300 000 0000', 'info@pos-professional.com')
    `);
        logger_1.default.info('Database initialized with initial data');
    }
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logger_1.default.error('Database query error:', err);
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            this.db.run(sql, params, function (err) {
                if (err) {
                    logger_1.default.error('Database run error:', err);
                    reject(err);
                }
                else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    logger_1.default.error('Error closing database:', err);
                }
                else {
                    logger_1.default.info('Database connection closed');
                }
            });
        }
    }
}
exports.dbService = new DatabaseService();
//# sourceMappingURL=DatabaseService.js.map