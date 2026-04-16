-- ============================================================
-- SimulaFinance — Rol SuperAdmin
-- ============================================================

-- 1. Ampliar constraint de rol
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('superadmin', 'admin', 'cliente'));

-- 2. Función SECURITY DEFINER (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.es_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Superadmin ve y actualiza todos los usuarios
DROP POLICY IF EXISTS "usuarios_superadmin_ver_todos" ON usuarios;
CREATE POLICY "usuarios_superadmin_ver_todos"
  ON usuarios FOR SELECT USING (es_superadmin());

DROP POLICY IF EXISTS "usuarios_superadmin_actualizar" ON usuarios;
CREATE POLICY "usuarios_superadmin_actualizar"
  ON usuarios FOR UPDATE USING (es_superadmin());

-- 4. Superadmin gestiona instituciones completamente
DROP POLICY IF EXISTS "instituciones_superadmin_all" ON instituciones;
CREATE POLICY "instituciones_superadmin_all"
  ON instituciones FOR ALL
  USING (es_superadmin()) WITH CHECK (es_superadmin());

-- 5. Superadmin puede insertar nuevos usuarios (para crear admins)
DROP POLICY IF EXISTS "usuarios_insertar_propio" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insertar" ON usuarios;
CREATE POLICY "usuarios_insertar"
  ON usuarios FOR INSERT
  WITH CHECK (es_superadmin() OR id = auth.uid());
