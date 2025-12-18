-- =============================================================================
-- Row Level Security (RLS) Policies for Multi-Tenant Isolation
-- =============================================================================
-- Este archivo debe ejecutarse DESPUÉS de las migraciones de Prisma
-- Habilita aislamiento automático de datos por tenant a nivel de PostgreSQL
-- =============================================================================

-- Función helper para obtener el tenant_id actual de la sesión
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función helper para verificar si es super admin (bypass RLS)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_super_admin', TRUE)::BOOLEAN, FALSE);
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Habilitar RLS en todas las tablas multi-tenant
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Políticas RLS por tabla
-- =============================================================================

-- USERS: Acceso solo a usuarios del mismo tenant o super admin
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (
    is_super_admin() 
    OR tenant_id IS NULL  -- Super admins sin tenant
    OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_super_admin() 
    OR tenant_id = current_tenant_id()
  );

-- LOCATIONS: Acceso solo a ubicaciones del tenant
CREATE POLICY tenant_isolation_locations ON locations
  FOR ALL
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- CLIENTS: Acceso solo a clientes del tenant
CREATE POLICY tenant_isolation_clients ON clients
  FOR ALL
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- SERVICES: Acceso solo a servicios del tenant
CREATE POLICY tenant_isolation_services ON services
  FOR ALL
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- APPOINTMENTS: Acceso solo a citas del tenant
CREATE POLICY tenant_isolation_appointments ON appointments
  FOR ALL
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- INVOICES: Acceso solo a facturas del tenant
CREATE POLICY tenant_isolation_invoices ON invoices
  FOR ALL
  USING (is_super_admin() OR tenant_id = current_tenant_id())
  WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- INVOICE_LINES: Acceso a través de la factura (JOIN implícito)
-- Las líneas no tienen tenant_id directo, se accede via invoice
CREATE POLICY tenant_isolation_invoice_lines ON invoice_lines
  FOR ALL
  USING (
    is_super_admin() 
    OR EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_lines.invoice_id 
      AND invoices.tenant_id = current_tenant_id()
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_lines.invoice_id 
      AND invoices.tenant_id = current_tenant_id()
    )
  );

-- AUDIT_LOGS: Acceso solo a logs del tenant (lectura), escritura siempre permitida
CREATE POLICY tenant_isolation_audit_logs_select ON audit_logs
  FOR SELECT
  USING (
    is_super_admin() 
    OR tenant_id IS NULL  -- Logs globales
    OR tenant_id = current_tenant_id()
  );

CREATE POLICY tenant_isolation_audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (TRUE);  -- Siempre permitir insertar logs

-- REFRESH_TOKENS: Acceso solo a tokens del usuario actual o super admin
CREATE POLICY tenant_isolation_refresh_tokens ON refresh_tokens
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = refresh_tokens.user_id
      AND (users.tenant_id IS NULL OR users.tenant_id = current_tenant_id())
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = refresh_tokens.user_id
      AND (users.tenant_id IS NULL OR users.tenant_id = current_tenant_id())
    )
  );

-- =============================================================================
-- Rol de aplicación (no puede bypass RLS)
-- =============================================================================

-- Crear rol si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lucia_app') THEN
    CREATE ROLE lucia_app NOINHERIT LOGIN;
  END IF;
END
$$;

-- Otorgar permisos al rol de aplicación
GRANT USAGE ON SCHEMA public TO lucia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lucia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lucia_app;

-- Asegurar que futuros objetos también tengan permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lucia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO lucia_app;

-- =============================================================================
-- Comentarios de documentación
-- =============================================================================

COMMENT ON FUNCTION current_tenant_id() IS 'Retorna el tenant_id configurado en la sesión actual via SET app.current_tenant_id';
COMMENT ON FUNCTION is_super_admin() IS 'Retorna TRUE si la sesión actual tiene permisos de super admin (bypass RLS)';

COMMENT ON POLICY tenant_isolation_users ON users IS 'Aísla usuarios por tenant_id. Super admins pueden ver todos.';
COMMENT ON POLICY tenant_isolation_clients ON clients IS 'Aísla clientes por tenant_id. Super admins pueden ver todos.';
COMMENT ON POLICY tenant_isolation_invoices ON invoices IS 'Aísla facturas por tenant_id. Super admins pueden ver todas.';
