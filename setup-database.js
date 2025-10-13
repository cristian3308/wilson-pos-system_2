const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a la base de datos
const dbPath = path.join(__dirname, 'backend', 'dist', 'database', 'pos_system.db');

console.log('📦 Creando base de datos en:', dbPath);

// Crear base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al crear la base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Base de datos creada exitosamente');
});

// SQL para crear la tabla
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

// SQL para crear índices
const createIndexesSQL = `
  CREATE INDEX IF NOT EXISTS idx_cash_closures_dates ON cash_closures(start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_cash_closures_created_at ON cash_closures(created_at);
`;

// Ejecutar SQL
db.serialize(() => {
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error al crear la tabla:', err.message);
      process.exit(1);
    }
    console.log('✅ Tabla cash_closures creada');
  });

  db.run(createIndexesSQL, (err) => {
    if (err) {
      console.error('❌ Error al crear índices:', err.message);
      process.exit(1);
    }
    console.log('✅ Índices creados');
  });

  // Verificar que la tabla existe
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='cash_closures'",
    (err, row) => {
      if (err) {
        console.error('❌ Error al verificar la tabla:', err.message);
      } else if (row) {
        console.log('✅ Verificación exitosa: Tabla existe');
      } else {
        console.error('⚠️  Advertencia: No se pudo verificar la tabla');
      }

      // Cerrar base de datos
      db.close((err) => {
        if (err) {
          console.error('❌ Error al cerrar la base de datos:', err.message);
          process.exit(1);
        }
        console.log('✅ Base de datos cerrada');
        console.log('');
        console.log('🎉 ¡INICIALIZACIÓN COMPLETA!');
        console.log('');
        console.log('Ahora puedes iniciar el servidor con: start-server.bat');
        process.exit(0);
      });
    }
  );
});
