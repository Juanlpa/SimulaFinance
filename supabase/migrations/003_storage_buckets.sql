-- ============================================================
-- SimulaFinance — Crear buckets de Storage
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Bucket logos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Bucket solicitudes-docs (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('solicitudes-docs', 'solicitudes-docs', false, 10485760, ARRAY['image/png','image/jpeg','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Bucket inversiones-docs (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('inversiones-docs', 'inversiones-docs', false, 10485760, ARRAY['image/png','image/jpeg','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ── Políticas RLS para Storage ────────────────────────────────

-- logos: lectura pública
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- logos: solo admins pueden subir
CREATE POLICY "logos_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
  );

-- logos: solo admins pueden actualizar/borrar
CREATE POLICY "logos_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "logos_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- solicitudes-docs: usuarios autenticados pueden subir sus propios archivos
CREATE POLICY "solicitudes_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'solicitudes-docs'
    AND auth.role() = 'authenticated'
  );

-- solicitudes-docs: solo el dueño o admin puede leer
CREATE POLICY "solicitudes_docs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'solicitudes-docs'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "solicitudes_docs_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'solicitudes-docs'
    AND auth.role() = 'authenticated'
  );

-- inversiones-docs: mismas políticas
CREATE POLICY "inversiones_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inversiones-docs'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "inversiones_docs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'inversiones-docs'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "inversiones_docs_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'inversiones-docs'
    AND auth.role() = 'authenticated'
  );
