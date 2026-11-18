-- =============================================================================
-- Stockearte - Script DDL de Inicialización y Semilla para PostgreSQL
-- =============================================================================

-- Eliminar tablas previas si existen (respetando dependencias)
DROP TABLE IF EXISTS tienda_inventario CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS tiendas CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Tabla: tiendas
-- -----------------------------------------------------------------------------
CREATE TABLE tiendas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    direccion VARCHAR(255) NOT NULL DEFAULT '',
    ciudad VARCHAR(100) NOT NULL DEFAULT '',
    provincia VARCHAR(100) NOT NULL DEFAULT '',
    habilitada BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tiendas_codigo ON tiendas(codigo);
CREATE INDEX idx_tiendas_habilitada ON tiendas(habilitada);

-- -----------------------------------------------------------------------------
-- 2. Tabla: usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasenia VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL DEFAULT '',
    apellido VARCHAR(100) NOT NULL DEFAULT '',
    habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    tienda_id INTEGER REFERENCES tiendas(id) ON DELETE SET NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'CASA_CENTRAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_nombre_usuario ON usuarios(nombre_usuario);
CREATE INDEX idx_usuarios_tienda_id ON usuarios(tienda_id);

-- -----------------------------------------------------------------------------
-- 3. Tabla: productos
-- -----------------------------------------------------------------------------
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    talle VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    foto TEXT DEFAULT '',
    habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_talle ON productos(talle);
CREATE INDEX idx_productos_color ON productos(color);

-- -----------------------------------------------------------------------------
-- 4. Tabla: tienda_inventario (Stock descentralizado por Tienda y Producto)
-- -----------------------------------------------------------------------------
CREATE TABLE tienda_inventario (
    tienda_id INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    PRIMARY KEY (tienda_id, producto_id)
);

CREATE INDEX idx_inventario_tienda ON tienda_inventario(tienda_id);
CREATE INDEX idx_inventario_producto ON tienda_inventario(producto_id);

-- =============================================================================
-- SEMILLA DE DATOS INICIALES (5 Tiendas, 5 Usuarios, 5 Productos con Stock)
-- =============================================================================

-- 1. Insertar 5 Tiendas físicas
INSERT INTO tiendas (id, codigo, direccion, ciudad, provincia, habilitada) VALUES
(1, 'SUC-PALERMO-01', 'Av. Santa Fe 3200', 'CABA', 'Buenos Aires', TRUE),
(2, 'SUC-CORDOBA-01', 'Peatonal 9 de Julio 150', 'Córdoba', 'Córdoba', TRUE),
(3, 'SUC-ROSARIO-01', 'Calle Córdoba 1020', 'Rosario', 'Santa Fe', TRUE),
(4, 'SUC-MENDOZA-01', 'Av. San Martín 850', 'Mendoza', 'Mendoza', TRUE),
(5, 'SUC-MARPLAT-01', 'Peatonal San Martín 2100', 'Mar del Plata', 'Buenos Aires', FALSE);

-- Sincronizar secuencia autoincremental de tiendas
SELECT setval('tiendas_id_seq', (SELECT MAX(id) FROM tiendas));

-- 2. Insertar 5 Usuarios
INSERT INTO usuarios (id, nombre_usuario, contrasenia, nombre, apellido, habilitado, tienda_id, rol) VALUES
(1, 'admin', 'admin123', 'Administrador', 'Central', TRUE, NULL, 'CASA_CENTRAL'),
(2, 'AnaG20', '123456', 'Ana', 'García', TRUE, 1, 'TIENDA'),
(3, 'CarlosL', '123456', 'Carlos', 'López', TRUE, 2, 'TIENDA'),
(4, 'LuciaM', '123456', 'Lucía', 'Martínez', TRUE, 3, 'TIENDA'),
(5, 'Enzo30', '123456', 'Enzo', 'Benítez', TRUE, NULL, 'CASA_CENTRAL');

-- Sincronizar secuencia autoincremental de usuarios
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- 3. Insertar 5 Productos (códigos alfanuméricos inmutables de 10 caracteres)
INSERT INTO productos (id, codigo, nombre, talle, color, foto, habilitado) VALUES
(1, 'PRD8492041', 'Remera Lisa de Algodón', 'M', 'Negro', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500', TRUE),
(2, 'PRD7742019', 'Pantalón Denim Clásico', '42', 'Azul', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', TRUE),
(3, 'PRD3910544', 'Buzo Hoodie Frisa', 'L', 'Gris', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500', TRUE),
(4, 'PRD5521890', 'Campera Bomber Urbana', 'XL', 'Verde Militar', 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500', TRUE),
(5, 'PRD6183025', 'Chomba Piqué Básica', 'S', 'Blanco', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500', TRUE);

-- Sincronizar secuencia autoincremental de productos
SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));

-- 4. Asignar Stock inicial a Tiendas (tienda_inventario)
INSERT INTO tienda_inventario (tienda_id, producto_id, stock) VALUES
(1, 1, 15),
(2, 1, 8),
(3, 1, 0),
(1, 2, 20),
(4, 2, 5),
(2, 3, 12),
(3, 3, 6),
(1, 4, 10),
(4, 4, 4),
(2, 5, 14),
(3, 5, 0);
