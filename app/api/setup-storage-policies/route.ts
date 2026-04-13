// ============================================================
// SimulaFinance — Aplicar políticas RLS a los buckets de Storage
// GET /api/setup-storage-policies  (usar solo una vez)
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

  const policiasSQL = [
    // logos: lectura pública
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_public_read' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
      END IF;
    END $$`,
    // logos: upload autenticados
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_admin_upload' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "logos_admin_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // logos: update autenticados
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'logos_admin_update' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "logos_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // solicitudes-docs: insert
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'solicitudes_docs_insert' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "solicitudes_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'solicitudes-docs' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // solicitudes-docs: select
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'solicitudes_docs_select' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "solicitudes_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'solicitudes-docs' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // solicitudes-docs: update
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'solicitudes_docs_update' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "solicitudes_docs_update" ON storage.objects FOR UPDATE USING (bucket_id = 'solicitudes-docs' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // inversiones-docs: insert
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inversiones_docs_insert' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "inversiones_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'inversiones-docs' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // inversiones-docs: select
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inversiones_docs_select' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "inversiones_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'inversiones-docs' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
    // inversiones-docs: update
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'inversiones_docs_update' AND schemaname = 'storage' AND tablename = 'objects') THEN
        CREATE POLICY "inversiones_docs_update" ON storage.objects FOR UPDATE USING (bucket_id = 'inversiones-docs' AND auth.role() = 'authenticated');
      END IF;
    END $$`,
  ]

  for (const sql of policiasSQL) {
    const { error } = await (supabase as any).rpc('query', { query: sql }).maybeSingle()
    if (error) {
      resultados[sql.substring(0, 40)] = `ERROR: ${error.message}`
    }
  }

  // Verificar que los buckets existen
  const { data: buckets } = await supabase.storage.listBuckets()
  resultados['buckets_existentes'] = buckets?.map(b => b.name).join(', ') || 'ninguno'

  return NextResponse.json({
    ok: true,
    message: 'Intento de aplicación de políticas completado',
    resultados,
    nota: 'Las políticas se aplican desde el Dashboard de Supabase → Storage → Policies si este endpoint falla',
  })
}
