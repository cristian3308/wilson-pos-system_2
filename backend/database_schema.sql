-- Database schema for pos-web-professional
-- Based on the working Python system

-- Company configuration
CREATE TABLE IF NOT EXISTS empresa_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL DEFAULT 'POS System',
    direccion TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    logo_path TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle types
CREATE TABLE IF NOT EXISTS tipos_vehiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT '',
    tarifa_hora DECIMAL(10,2) DEFAULT 2000,
    tarifa_dia DECIMAL(10,2) DEFAULT 15000,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parking spaces
CREATE TABLE IF NOT EXISTS espacios_parqueadero (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    tipo_vehiculo_id INTEGER,
    estado TEXT DEFAULT 'DISPONIBLE' CHECK(estado IN ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO')),
    observaciones TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_vehiculo_id) REFERENCES tipos_vehiculos(id)
);

-- Parking vehicles
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
);

-- Carwash services
CREATE TABLE IF NOT EXISTS servicios_lavadero (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    precio DECIMAL(10,2) NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT 1,
    categoria TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Carwash orders
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
);

-- Carwash order services (relation table)
CREATE TABLE IF NOT EXISTS orden_servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id INTEGER NOT NULL,
    servicio_id INTEGER NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes_lavadero(id),
    FOREIGN KEY (servicio_id) REFERENCES servicios_lavadero(id)
);

-- System configuration
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial data
INSERT OR IGNORE INTO empresa_config (nombre, direccion, telefono, email) 
VALUES ('POS Professional', 'Dirección Principal', '+57 300 000 0000', 'info@pos-professional.com');

INSERT OR IGNORE INTO tipos_vehiculos (nombre, descripcion, tarifa_hora, tarifa_dia) VALUES
('Carro', 'Automóvil estándar', 2000, 15000),
('Moto', 'Motocicleta', 1000, 8000),
('Bicicleta', 'Bicicleta', 500, 3000);

INSERT OR IGNORE INTO servicios_lavadero (nombre, descripcion, precio, duracion_minutos, categoria) VALUES
('Lavado Básico', 'Lavado exterior básico con agua y jabón', 8000, 30, 'basico'),
('Lavado Completo', 'Lavado completo exterior e interior', 15000, 60, 'completo'),
('Encerado', 'Aplicación de cera protectora', 12000, 45, 'premium'),
('Aspirado', 'Aspirado completo del interior', 5000, 20, 'basico');

INSERT OR IGNORE INTO configuracion_sistema (clave, valor, descripcion) VALUES
('espacios_totales', '50', 'Número total de espacios de parqueadero'),
('tiempo_gracia', '10', 'Minutos de gracia para el pago'),
('moneda', 'COP', 'Moneda del sistema'),
('iva', '19', 'Porcentaje de IVA');