-- Script de inicialización de la base de datos
-- Este script se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'UTC';

-- Crear índices adicionales para mejorar performance (se ejecutarán después de las migraciones)
-- Estos comandos fallarán si las tablas no existen aún, pero eso está bien
DO $$
BEGIN
    -- Índices para productos
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_title_search ON products USING gin(title gin_trgm_ops);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price) WHERE is_active = true;
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock ON products(stock) WHERE is_active = true;
    END IF;

    -- Índices para usuarios
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email, is_active);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role) WHERE is_active = true;
    END IF;

    -- Índices para carrito
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart_items') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_cart_product ON cart_items(cart_id, product_id);
    END IF;

    -- Índices para logs del sistema
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_logs') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_level_created ON system_logs(level, created_at);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_context ON system_logs(context);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Ignorar errores si las tablas no existen aún
        RAISE NOTICE 'Algunas tablas no existen aún, los índices se crearán después de las migraciones';
END $$;
