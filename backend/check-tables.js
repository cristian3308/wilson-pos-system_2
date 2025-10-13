const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dist', 'database', 'pos_system.db');
console.log('\n📁 Verificando base de datos en:', dbPath);
console.log('='.repeat(60));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al abrir la base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexión exitosa\n');
});

// Listar todas las tablas
db.all(
  `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
  [],
  (err, tables) => {
    if (err) {
      console.error('❌ Error al listar tablas:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('📋 TABLAS EN LA BASE DE DATOS:');
    console.log('-'.repeat(60));
    
    if (tables.length === 0) {
      console.log('   ⚠️  No hay tablas en la base de datos');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name}`);
      });
    }
    
    console.log('-'.repeat(60));
    console.log(`\n✅ Total de tablas: ${tables.length}`);
    
    // Verificar específicamente si existe cash_closures
    const hasCashClosures = tables.some(t => t.name === 'cash_closures');
    
    if (hasCashClosures) {
      console.log('\n✅ La tabla "cash_closures" EXISTE');
    } else {
      console.log('\n❌ La tabla "cash_closures" NO EXISTE');
      console.log('   💡 Necesitas ejecutar: init-database.bat');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    db.close();
  }
);
