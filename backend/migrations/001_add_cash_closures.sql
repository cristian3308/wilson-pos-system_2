-- Migración: Agregar tabla cash_closures
-- Fecha: 2025-10-11
-- Descripción: Tabla para almacenar cierres de caja con historial

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

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_cash_closures_dates ON cash_closures(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_cash_closures_number ON cash_closures(closure_number);
