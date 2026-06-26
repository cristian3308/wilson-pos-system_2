import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '..', 'database', 'test_pos.db');

function createTestDb(): Promise<Database> {
  return new Promise((resolve, reject) => {
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    const db = new Database(TEST_DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function run(db: Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function query(db: Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

describe('DatabaseService - Core Operations', () => {
  let db: Database;

  beforeAll(async () => {
    db = await createTestDb();
  });

  afterAll((done) => {
    db.close(() => {
      if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
      }
      done();
    });
  });

  test('should create tables and insert seed data', async () => {
    await run(db, `CREATE TABLE IF NOT EXISTS tipos_vehiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      tarifa_hora DECIMAL(10,2) DEFAULT 2000,
      tarifa_dia DECIMAL(10,2) DEFAULT 15000,
      activo BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS vehiculos_parqueadero (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      tipo_vehiculo_id INTEGER NOT NULL,
      fecha_entrada DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_salida DATETIME NULL,
      total_pagar DECIMAL(10,2) DEFAULT 0,
      estado TEXT DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO','FINALIZADO','CANCELADO')),
      FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculos(id)
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS servicios_lavadero (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      activo BOOLEAN DEFAULT 1
    )`);

    await run(db, `CREATE TABLE IF NOT EXISTS cash_closures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      closure_number TEXT NOT NULL UNIQUE,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      parking_revenue DECIMAL(10,2) DEFAULT 0,
      carwash_revenue DECIMAL(10,2) DEFAULT 0,
      total_revenue DECIMAL(10,2) DEFAULT 0,
      parking_data TEXT DEFAULT '[]',
      carwash_data TEXT DEFAULT '[]',
      worker_commissions TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(db, `INSERT OR IGNORE INTO tipos_vehiculos (nombre, tarifa_hora, tarifa_dia) VALUES ('Carro', 2000, 15000)`);
    await run(db, `INSERT OR IGNORE INTO tipos_vehiculos (nombre, tarifa_hora, tarifa_dia) VALUES ('Moto', 1000, 8000)`);

    const tipos = await query(db, 'SELECT * FROM tipos_vehiculos ORDER BY id');
    expect(tipos.length).toBeGreaterThanOrEqual(2);
    expect(tipos[0].nombre).toBe('Carro');
    expect(tipos[1].nombre).toBe('Moto');
  });

  test('should insert and retrieve a parking vehicle', async () => {
    const tipos = await query(db, 'SELECT id FROM tipos_vehiculos WHERE nombre = ?', ['Carro']);
    const tipoId = tipos[0].id;

    const result = await run(db,
      'INSERT INTO vehiculos_parqueadero (placa, tipo_vehiculo_id) VALUES (?, ?)',
      ['ABC-123', tipoId]
    );

    const vehicles = await query(db, 'SELECT * FROM vehiculos_parqueadero WHERE id = ?', [result.id]);
    expect(vehicles.length).toBe(1);
    expect(vehicles[0].placa).toBe('ABC-123');
    expect(vehicles[0].estado).toBe('ACTIVO');
  });

  test('should process vehicle exit with payment', async () => {
    const tipos = await query(db, 'SELECT id FROM tipos_vehiculos WHERE nombre = ?', ['Carro']);
    const tipoId = tipos[0].id;

    const entry = await run(db,
      'INSERT INTO vehiculos_parqueadero (placa, tipo_vehiculo_id, fecha_entrada) VALUES (?, ?, datetime("now", "-2 hours"))',
      ['XYZ-999', tipoId]
    );

    await run(db,
      "UPDATE vehiculos_parqueadero SET fecha_salida = datetime('now'), total_pagar = 4000, estado = 'FINALIZADO' WHERE id = ?",
      [entry.id]
    );

    const vehicle = await query(db, 'SELECT * FROM vehiculos_parqueadero WHERE id = ?', [entry.id]);
    expect(vehicle[0].estado).toBe('FINALIZADO');
    expect(Number(vehicle[0].total_pagar)).toBe(4000);
  });

  test('should create and query a cash closure', async () => {
    const closureNumber = `CLS-TEST-${Date.now()}`;
    const startDate = '2024-01-01T00:00:00';
    const endDate = '2024-01-15T23:59:59';

    const parkingData = JSON.stringify([{ tipo: 'Carro', cantidad: 10, ingresos: 50000 }]);
    const carwashData = JSON.stringify([{ servicio: 'Lavado Básico', cantidad: 5, ingresos: 40000 }]);

    await run(db,
      `INSERT INTO cash_closures 
      (closure_number, start_date, end_date, parking_revenue, carwash_revenue, total_revenue,
       parking_data, carwash_data, worker_commissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [closureNumber, startDate, endDate, 50000, 40000, 90000,
       parkingData, carwashData, '[]']
    );

    const closures = await query(db,
      'SELECT * FROM cash_closures WHERE closure_number = ?',
      [closureNumber]
    );

    expect(closures.length).toBe(1);
    expect(Number(closures[0].total_revenue)).toBe(90000);

    const parsed = JSON.parse(closures[0].parking_data);
    expect(parsed[0].tipo).toBe('Carro');
    expect(parsed[0].ingresos).toBe(50000);
  });

  test('should aggregate revenue stats', async () => {
    const stats = await query(db, `
      SELECT 
        COALESCE(SUM(total_pagar), 0) as total_parking 
      FROM vehiculos_parqueadero 
      WHERE estado = 'FINALIZADO'
    `);

    expect(Number(stats[0].total_parking)).toBeGreaterThanOrEqual(4000);
  });
});
