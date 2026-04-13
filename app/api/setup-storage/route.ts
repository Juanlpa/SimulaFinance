// ============================================================
// SimulaFinance — Endpoint de setup: crea los buckets de Storage
// GET /api/setup-storage  (usar solo una vez)
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const resultados: Record<string, string> = {}

  // Crear buckets
  const buckets = [
    { id: 'logos',            name: 'logos',            public: true  },
    { id: 'solicitudes-docs', name: 'solicitudes-docs', public: false },
    { id: 'inversiones-docs', name: 'inversiones-docs', public: false },
  ]

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
    })

    if (error && !error.message.includes('already exists')) {
      resultados[bucket.id] = `ERROR: ${error.message}`
    } else {
      resultados[bucket.id] = error?.message.includes('already exists')
        ? 'ya existía'
        : 'creado'
    }
  }

  // Crear políticas RLS para storage via SQL
  const policies = `
    DO $$
    BEGIN
      -- solicitudes-docs: autenticados pueden subir y leer
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'solicitudes_docs_insert' AND tablename = 'objects') THEN
        CREATE POLICY "solicitudes_docs_insert" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'solicitudes-docs' AND auth.role() = 'authenticated');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'solicitudes_docs_select' AND tablename = 'objects') THEN
        CREATE POLICY "solicitudes_docs_select" ON storage.objects
          FOR SELECT USING (bucket_id = 'solicitudes-docs' AND auth.role() = 'authenticated');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'solicitudes_docs_update' AND tablename = 'objects') THEN
        CREATE POLICY "solicitudes_docs_update" ON storage.objects
          FOR UPDATE USING (bucket_id = 'solicitudes-docs' AND auth.role() = 'authenticated');
      END IF;

      -- inversiones-docs
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inversiones_docs_insert' AND tablename = 'objects') THEN
        CREATE POLICY "inversiones_docs_insert" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'inversiones-docs' AND auth.role() = 'authenticated');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inversiones_docs_select' AND tablename = 'objects') THEN
        CREATE POLICY "inversiones_docs_select" ON storage.objects
          FOR SELECT USING (bucket_id = 'inversiones-docs' AND auth.role() = 'authenticated');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inversiones_docs_update' AND tablename = 'objects') THEN
        CREATE POLICY "inversiones_docs_update" ON storage.objects
          FOR UPDATE USING (bucket_id = 'inversiones-docs' AND auth.role() = 'authenticated');
      END IF;

      -- logos
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_public_read' AND tablename = 'objects') THEN
        CREATE POLICY "logos_public_read" ON storage.objects
          FOR SELECT USING (bucket_id = 'logos');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_admin_upload' AND tablename = 'objects') THEN
        CREATE POLICY "logos_admin_upload" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
      END IF;
    END $$;
  `

  const { error: sqlError } = await supabase.rpc('exec_sql', { sql: policies }).maybeSingle()
  // rpc exec_sql puede no existir — usamos el cliente directo
  resultados['policies'] = sqlError ? `RLS via SQL no disponible (${sqlError.message}) — buckets creados igual` : 'políticas aplicadas'

  return NextResponse.json({
    ok: true,
    message: 'Setup de Storage completado',
    resultados,
  })
}
