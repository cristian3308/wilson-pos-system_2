import { ParkingController } from '../controllers/ParkingController';

const controller = new ParkingController();

const calc = (entry: Date, exit: Date, hourly: number, daily: number): number =>
  (controller as any).calculateFee(entry, exit, hourly, daily);

describe('ParkingController - calculateFee', () => {
  const baseDate = new Date('2024-01-15T08:00:00');
  const HOURLY = 2000;
  const DAILY = 15000;

  test('1 hour -> hourly rate', () => {
    const exit = new Date(baseDate.getTime() + 60 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(2000);
  });

  test('3 hours -> hourly rate', () => {
    const exit = new Date(baseDate.getTime() + 3 * 60 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(6000);
  });

  test('9 hours -> daily rate', () => {
    const exit = new Date(baseDate.getTime() + 9 * 60 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(15000);
  });

  test('25 hours -> 2 daily rates', () => {
    const exit = new Date(baseDate.getTime() + 25 * 60 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(30000);
  });

  test('10 min rounds up to 1 hour', () => {
    const exit = new Date(baseDate.getTime() + 10 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(2000);
  });

  test('61 min rounds up to 2 hours', () => {
    const exit = new Date(baseDate.getTime() + 61 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(4000);
  });

  test('exactly 8 hours -> hourly (8 * 2000)', () => {
    const exit = new Date(baseDate.getTime() + 8 * 60 * 60 * 1000);
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(16000);
  });

  test('zero time -> 0 (same entry/exit)', () => {
    const exit = new Date(baseDate.getTime());
    expect(calc(baseDate, exit, HOURLY, DAILY)).toBe(0);
  });
});
