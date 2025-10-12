"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '..', 'database', 'pos_system.db');
const createTable = () => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3_1.default.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Error al conectar con la base de datos:', err);
                return reject(err);
            }
            console.log('✅ Conectado a la base de datos');
        });
        const sql = `
      CREATE TABLE IF NOT EXISTS cash_closures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        closure_number TEXT NOT NULL UNIQUE,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        parking_revenue DECIMAL(10,2) DEFAULT 0,
        carwash_revenue DECIMAL(10,2) DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0,
        total_commissions DECIMAL(10,2) DEFAULT 0,
        net_profit DECIMAL(10,2) DEFAULT 0,
        parking_data TEXT DEFAULT '[]',
        carwash_data TEXT DEFAULT '[]',
        worker_commissions TEXT DEFAULT '[]',
        created_by TEXT DEFAULT 'sistema',
        notes TEXT DEFAULT '',
        pdf_generated BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cash_closures_dates ON cash_closures(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_cash_closures_created_at ON cash_closures(created_at);
    `;
        db.exec(sql, (err) => {
            if (err) {
                console.error('❌ Error al crear la tabla:', err);
                db.close();
                return reject(err);
            }
            console.log('✅ Tabla cash_closures creada exitosamente');
            console.log('✅ Índices creados exitosamente');
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_closures'", (err, row) => {
                if (err) {
                    console.error('❌ Error al verificar la tabla:', err);
                }
                else if (row) {
                    console.log('✅ Verificación: Tabla cash_closures existe');
                }
                else {
                    console.error('❌ Advertencia: No se pudo verificar la tabla');
                }
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error al cerrar la base de datos:', err);
                        return reject(err);
                    }
                    console.log('✅ Base de datos cerrada');
                    resolve(true);
                });
            });
        });
    });
};
createTable()
    .then(() => {
    console.log('\n🎉 Migración completada exitosamente');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Error en la migración:', error);
    process.exit(1);
});
//# sourceMappingURL=create-cash-closures-table.js.map