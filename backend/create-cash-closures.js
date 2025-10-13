const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dist', 'database', 'pos_system.db');
console.log('\n📁 Agregando tabla cash_closures a:', dbPath);
console.log('='.repeat(70));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al abrir la base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa\n');
});

const createTableSQL = `
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
`;

const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_cash_closures_dates ON cash_closures(start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_cash_closures_created_at ON cash_closures(created_at);
`;

console.log('⏳ Creando tabla cash_closures...\n');

db.exec(createTableSQL + createIndexes, (err) => {
  if (err) {
    console.error('❌ Error al crear la tabla:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('✅ Tabla "cash_closures" creada exitosamente');
  console.log('✅ Índices creados exitosamente\n');

  // Verificar que la tabla existe
  db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='cash_closures'`,
    [],
    (err, row) => {
      if (err) {
        console.error('❌ Error al verificar:', err.message);
      } else if (row) {
        console.log('✅ Verificación: Tabla "cash_closures" existe');
        
        // Mostrar estructura de la tabla
        db.all(`PRAGMA table_info(cash_closures)`, [], (err, columns) => {
          if (!err && columns) {
            console.log('\n📋 ESTRUCTURA DE LA TABLA:');
            console.log('-'.repeat(70));
            columns.forEach(col => {
              console.log(`   ${col.name.padEnd(25)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : ''}`);
            });
            console.log('-'.repeat(70));
          }
          
          console.log('\n🎉 ¡LISTO! Ahora el sistema de cierres de caja funcionará correctamente');
          console.log('='.repeat(70) + '\n');
          db.close();
        });
      } else {
        console.error('❌ No se pudo verificar la tabla');
        db.close();
        process.exit(1);
      }
    }
  );
});
