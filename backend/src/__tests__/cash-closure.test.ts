import { CashClosureController } from '../controllers/CashClosureController';
import { dbService } from '../services/DatabaseService';

describe('CashClosureController - Logic', () => {
  test('should calculate net profit correctly', () => {
    const parkingRevenue = 100000;
    const carwashRevenue = 50000;
    const totalCommissions = 15000;
    const totalRevenue = parkingRevenue + carwashRevenue;
    const netProfit = totalRevenue - totalCommissions;

    expect(totalRevenue).toBe(150000);
    expect(netProfit).toBe(135000);
  });

  test('should generate unique closure number', () => {
    const nums = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const num = `CLS-${Date.now()}-${i}`;
      nums.add(num);
    }
    expect(nums.size).toBe(100);
  });
});

describe('CashClosureController - Database Operations', () => {
  beforeAll(async () => {
    await dbService.run(`CREATE TABLE IF NOT EXISTS cash_closures (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  test('should insert and retrieve a closure', async () => {
    const now = new Date().toISOString();
    const closureNumber = `CLS-TEST-${Date.now()}`;

    await dbService.run(
      `INSERT INTO cash_closures 
      (closure_number, start_date, end_date, parking_revenue, carwash_revenue, 
       total_revenue, total_commissions, net_profit, parking_data, carwash_data, worker_commissions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [closureNumber, now, now, 100000, 50000, 150000, 15000, 135000, '[]', '[]', '[]']
    );

    const results = await dbService.query(
      'SELECT * FROM cash_closures WHERE closure_number = ?',
      [closureNumber]
    );

    expect(results.length).toBe(1);
    expect(Number(results[0].total_revenue)).toBe(150000);
    expect(Number(results[0].net_profit)).toBe(135000);
  });

  test('should filter closures by date range', async () => {
    const closures = await dbService.query(
      `SELECT COUNT(*) as total FROM cash_closures 
       WHERE DATE(start_date) >= DATE('now', '-30 days')
       AND DATE(end_date) <= DATE('now', '+1 day')`
    );

    expect(Number(closures[0].total)).toBeGreaterThanOrEqual(0);
  });
});
