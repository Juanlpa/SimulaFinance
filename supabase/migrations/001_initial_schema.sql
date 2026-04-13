-- ============================================================
-- SimulaFinance — Schema inicial de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ─── Extensiones ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Instituciones financieras ────────────────────────────────
CREATE TABLE instituciones (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre           VARCHAR(255) NOT NULL,
  logo_url         TEXT,
  slogan           TEXT,
  color_primario   VARCHAR(7)  DEFAULT '#1a1a2e',
  color_secundario VARCHAR(7)  DEFAULT '#16213e',
  color_acento     VARCHAR(7)  DEFAULT '#0f3460',
  direccion        TEXT,
  ciudad           VARCHAR(100),
  telefono         VARCHAR(20),
  email            VARCHAR(255),
  sitio_web        TEXT,
  ruc_institucion  VARCHAR(13),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Usuarios ─────────────────────────────────────────────────
CREATE TABLE usuarios (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  institucion_id  UUID REFERENCES instituciones(id) ON DELETE SET NULL,
  nombre          VARCHAR(255) NOT NULL,
  apellido        VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  cedula          VARCHAR(10),
  ruc             VARCHAR(13),
  telefono        VARCHAR(15),
  direccion       TEXT,
  rol             VARCHAR(20) CHECK (rol IN ('admin', 'cliente')) NOT NULL DEFAULT 'cliente',
  foto_perfil_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tasas de referencia BCE ──────────────────────────────────
CREATE TABLE tasas_referencia (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segmento          VARCHAR(100) NOT NULL,
  subsegmento       VARCHAR(100),
  tasa_referencial  DECIMAL(5,2) NOT NULL,
  tasa_maxima       DECIMAL(5,2) NOT NULL,
  vigencia_desde    DATE NOT NULL,
  vigencia_hasta    DATE,
  resolucion_legal  TEXT NOT NULL,
  fuente            TEXT DEFAULT 'Banco Central del Ecuador',
  activo            BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tipos de crédito ─────────────────────────────────────────
CREATE TABLE tipos_credito (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion_id        UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  nombre                VARCHAR(100) NOT NULL,
  segmento_bce          VARCHAR(100) NOT NULL,
  tasa_interes_anual    DECIMAL(5,2) NOT NULL,
  descripcion           TEXT,
  requiere_ruc          BOOLEAN DEFAULT false,
  activo                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Validación: tasa no puede superar la máxima del segmento
-- (Se valida en aplicación comparando con tasas_referencia)

-- ─── Subtipos de crédito ──────────────────────────────────────
CREATE TABLE subtipos_credito (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_credito_id  UUID REFERENCES tipos_credito(id) ON DELETE CASCADE,
  nombre           VARCHAR(100) NOT NULL,
  monto_min        DECIMAL(12,2) NOT NULL,
  monto_max        DECIMAL(12,2) NOT NULL,
  plazo_min_meses  INT NOT NULL,
  plazo_max_meses  INT NOT NULL,
  descripcion      TEXT,
  activo           BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT monto_rango_valido CHECK (monto_min < monto_max),
  CONSTRAINT plazo_rango_valido CHECK (plazo_min_meses < plazo_max_meses)
);

-- ─── Cobros indirectos ────────────────────────────────────────
-- LÓGICA: total del cobro se calcula y luego se divide entre el número de cuotas.
-- El resultado es un valor FIJO igual en cada cuota.
CREATE TABLE cobros_indirectos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion_id   UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  tipo_credito_id  UUID REFERENCES tipos_credito(id) ON DELETE SET NULL,
  nombre           VARCHAR(100) NOT NULL,
  tipo_cobro       VARCHAR(20) CHECK (tipo_cobro IN ('porcentaje', 'fijo')) NOT NULL,
  valor            DECIMAL(10,4) NOT NULL,
  -- si porcentaje: 0.50 para 0.5%. Si fijo: 700.00 para $700
  base_calculo     VARCHAR(30) DEFAULT 'monto_credito'
                   CHECK (base_calculo IN ('monto_credito', 'valor_bien')),
  obligatorio      BOOLEAN DEFAULT true,
  es_global        BOOLEAN DEFAULT false,
  -- true = aplica a todos los créditos (ej: SOLCA)
  es_solca         BOOLEAN DEFAULT false,
  -- true = lógica especial: proporcional para plazos <= 12 meses
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Requisitos de crédito ────────────────────────────────────
CREATE TABLE requisitos_credito (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_credito_id  UUID REFERENCES tipos_credito(id) ON DELETE CASCADE,
  nombre           VARCHAR(100) NOT NULL,
  descripcion      TEXT,
  obligatorio      BOOLEAN DEFAULT true,
  tipo_archivo     VARCHAR(20) DEFAULT 'documento'
                   CHECK (tipo_archivo IN ('documento', 'imagen', 'cedula', 'ruc')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Análisis financiero ──────────────────────────────────────
CREATE TABLE analisis_financiero (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id               UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  ingresos_mensuales       DECIMAL(12,2) NOT NULL,
  gastos_mensuales         DECIMAL(12,2) NOT NULL,
  otros_creditos_cuota     DECIMAL(12,2) DEFAULT 0,
  patrimonio               DECIMAL(12,2) DEFAULT 0,
  descripcion_ingresos     TEXT,
  descripcion_patrimonio   TEXT,
  capacidad_pago_mensual   DECIMAL(12,2),
  porcentaje_endeudamiento DECIMAL(5,2),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Historial de simulaciones ────────────────────────────────
CREATE TABLE simulaciones (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id             UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_credito_id        UUID REFERENCES tipos_credito(id) ON DELETE SET NULL,
  subtipo_credito_id     UUID REFERENCES subtipos_credito(id) ON DELETE SET NULL,
  monto                  DECIMAL(12,2) NOT NULL,
  valor_bien             DECIMAL(12,2),
  plazo_meses            INT NOT NULL,
  tasa_aplicada          DECIMAL(5,2) NOT NULL,
  sistema_amortizacion   VARCHAR(10) CHECK (sistema_amortizacion IN ('francesa', 'alemana')) NOT NULL,
  cuota_base             DECIMAL(12,2) NOT NULL,
  cuota_final            DECIMAL(12,2) NOT NULL,
  total_a_pagar          DECIMAL(12,2) NOT NULL,
  total_intereses        DECIMAL(12,2) NOT NULL,
  tabla_json             JSONB NOT NULL,
  cobros_desglose_json   JSONB NOT NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Solicitudes de crédito ───────────────────────────────────
CREATE TABLE solicitudes_credito (
  id                           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id                   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  simulacion_id                UUID REFERENCES simulaciones(id) ON DELETE SET NULL,
  tipo_credito_id              UUID REFERENCES tipos_credito(id) ON DELETE SET NULL,
  subtipo_credito_id           UUID REFERENCES subtipos_credito(id) ON DELETE SET NULL,
  analisis_financiero_id       UUID REFERENCES analisis_financiero(id) ON DELETE SET NULL,
  monto                        DECIMAL(12,2) NOT NULL,
  valor_bien                   DECIMAL(12,2),
  plazo_meses                  INT NOT NULL,
  tasa_aplicada                DECIMAL(5,2) NOT NULL,
  cuota_base                   DECIMAL(12,2) NOT NULL,
  cuota_final                  DECIMAL(12,2) NOT NULL,
  sistema_amortizacion         VARCHAR(10) CHECK (sistema_amortizacion IN ('francesa', 'alemana')) NOT NULL,
  estado                       VARCHAR(20) DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente', 'documentos', 'analisis', 'biometria', 'en_revision', 'aprobada', 'rechazada')),
  cedula_url                   TEXT,
  ruc_url                      TEXT,
  documentos_adicionales_json  JSONB,
  selfie_url                   TEXT,
  biometria_validada           BOOLEAN DEFAULT false,
  cuota_maxima_sugerida        DECIMAL(12,2),
  motivo_rechazo               TEXT,
  observaciones_admin          TEXT,
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Productos de inversión ───────────────────────────────────
CREATE TABLE productos_inversion (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion_id       UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  nombre               VARCHAR(100) NOT NULL,
  tipo_inversion       VARCHAR(50) NOT NULL
                       CHECK (tipo_inversion IN ('plazo_fijo', 'ahorro_programado', 'ahorro_objetivo')),
  tasa_interes_anual   DECIMAL(5,2) NOT NULL,
  plazo_min_dias       INT NOT NULL,
  plazo_max_dias       INT NOT NULL,
  monto_min            DECIMAL(12,2) NOT NULL,
  monto_max            DECIMAL(12,2),
  frecuencia_aporte    VARCHAR(20) DEFAULT 'unico'
                       CHECK (frecuencia_aporte IN ('unico', 'mensual', 'trimestral', 'semestral', 'anual')),
  objetivo             VARCHAR(100),
  descripcion          TEXT,
  activo               BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Solicitudes de inversión ─────────────────────────────────
CREATE TABLE solicitudes_inversion (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id               UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id              UUID REFERENCES productos_inversion(id) ON DELETE SET NULL,
  monto                    DECIMAL(12,2) NOT NULL,
  plazo_dias               INT NOT NULL,
  rendimiento_estimado     DECIMAL(12,2),
  aporte_periodico         DECIMAL(12,2),
  estado                   VARCHAR(20) DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente', 'documentos', 'biometria', 'en_revision', 'aprobada', 'rechazada')),
  documento_identidad_url  TEXT,
  selfie_url               TEXT,
  biometria_validada       BOOLEAN DEFAULT false,
  observaciones_admin      TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE instituciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasas_referencia     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_credito        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtipos_credito     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros_indirectos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_credito   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis_financiero  ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulaciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_credito  ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_inversion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_inversion ENABLE ROW LEVEL SECURITY;

-- ─── Políticas RLS básicas ────────────────────────────────────

-- Instituciones: lectura pública, escritura solo admin
CREATE POLICY "instituciones_lectura_publica"
  ON instituciones FOR SELECT USING (true);

CREATE POLICY "instituciones_escritura_admin"
  ON instituciones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Usuarios: cada usuario ve su propio perfil; admin ve todos
CREATE POLICY "usuarios_ver_propio"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "usuarios_admin_ver_todos"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

CREATE POLICY "usuarios_insertar_propio"
  ON usuarios FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_actualizar_propio"
  ON usuarios FOR UPDATE
  USING (id = auth.uid());

-- Tasas referencia: lectura pública; escritura solo admin
CREATE POLICY "tasas_lectura_publica"
  ON tasas_referencia FOR SELECT USING (true);

CREATE POLICY "tasas_escritura_admin"
  ON tasas_referencia FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Tipos de crédito: lectura pública; escritura solo admin
CREATE POLICY "tipos_credito_lectura_publica"
  ON tipos_credito FOR SELECT USING (activo = true);

CREATE POLICY "tipos_credito_escritura_admin"
  ON tipos_credito FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Subtipos de crédito: lectura pública; escritura solo admin
CREATE POLICY "subtipos_lectura_publica"
  ON subtipos_credito FOR SELECT USING (activo = true);

CREATE POLICY "subtipos_escritura_admin"
  ON subtipos_credito FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Cobros indirectos: lectura pública; escritura solo admin
CREATE POLICY "cobros_lectura_publica"
  ON cobros_indirectos FOR SELECT USING (true);

CREATE POLICY "cobros_escritura_admin"
  ON cobros_indirectos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Requisitos de crédito: lectura pública; escritura solo admin
CREATE POLICY "requisitos_lectura_publica"
  ON requisitos_credito FOR SELECT USING (true);

CREATE POLICY "requisitos_escritura_admin"
  ON requisitos_credito FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Análisis financiero: solo el propio usuario o admin
CREATE POLICY "analisis_ver_propio"
  ON analisis_financiero FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "analisis_insertar_propio"
  ON analisis_financiero FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "analisis_actualizar_propio"
  ON analisis_financiero FOR UPDATE
  USING (usuario_id = auth.uid());

-- Simulaciones: usuario propio puede ver/crear; admin ve todas
CREATE POLICY "simulaciones_ver"
  ON simulaciones FOR SELECT
  USING (
    usuario_id = auth.uid() OR usuario_id IS NULL OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "simulaciones_insertar"
  ON simulaciones FOR INSERT
  WITH CHECK (usuario_id = auth.uid() OR usuario_id IS NULL);

-- Solicitudes de crédito: cliente ve las suyas; admin ve todas
CREATE POLICY "solicitudes_credito_ver"
  ON solicitudes_credito FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "solicitudes_credito_insertar"
  ON solicitudes_credito FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "solicitudes_credito_actualizar"
  ON solicitudes_credito FOR UPDATE
  USING (
    usuario_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Productos de inversión: lectura pública; escritura solo admin
CREATE POLICY "productos_inversion_lectura_publica"
  ON productos_inversion FOR SELECT USING (activo = true);

CREATE POLICY "productos_inversion_escritura_admin"
  ON productos_inversion FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
    )
  );

-- Solicitudes de inversión: cliente ve las suyas; admin ve todas
CREATE POLICY "solicitudes_inversion_ver"
  ON solicitudes_inversion FOR SELECT
  USING (
    usuario_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "solicitudes_inversion_insertar"
  ON solicitudes_inversion FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "solicitudes_inversion_actualizar"
  ON solicitudes_inversion FOR UPDATE
  USING (
    usuario_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- ─── Trigger: updated_at automático ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instituciones_updated_at
  BEFORE UPDATE ON instituciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_credito_updated_at
  BEFORE UPDATE ON solicitudes_credito
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitudes_inversion_updated_at
  BEFORE UPDATE ON solicitudes_inversion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Función: crear perfil de usuario al registrarse ─────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Datos iniciales: Tasas BCE marzo 2026 ────────────────────
INSERT INTO tasas_referencia (segmento, subsegmento, tasa_referencial, tasa_maxima, vigencia_desde, resolucion_legal) VALUES
  ('Productivo Corporativo',    NULL,                   8.23,  8.23,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Productivo Empresarial',    NULL,                  10.44, 10.44,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Productivo PYMES',          NULL,                  10.69, 10.69,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Consumo Ordinario',         NULL,                  16.77, 16.77,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Consumo Prioritario',       NULL,                  16.77, 16.77,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Educativo',                 NULL,                   9.50,  9.50,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Educativo',                 'Social',               7.50,  7.50,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Inmobiliario',              NULL,                  10.96, 10.96,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Vivienda de Interés Público', NULL,                 4.99,  4.99,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Vivienda de Interés Social', NULL,                  4.99,  4.99,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Microcrédito',              'Minorista',           28.23, 28.23,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Microcrédito',              'Acumulación Simple',  24.89, 24.89,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Microcrédito',              'Acumulación Ampliada',22.05, 22.05,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador'),
  ('Inversión Pública',         NULL,                   9.33,  9.33,  '2026-03-01', 'Resolución JPRF-F-2024 — Banco Central del Ecuador');
