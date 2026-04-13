Necesito que generes el plan inicial y estructura de un proyecto llamado "SimulaFinance". Es un simulador de tablas de amortización e inversiones para una institución financiera ecuatoriana. Este proyecto es académico y debe funcionar como un producto que se "vende" a cualquier banco o cooperativa — todo debe ser configurable por el administrador.

## Stack tecnológico
- **Framework:** Next.js 14+ (App Router) con TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui (colores del tema dinámicos, configurados por el admin)
- **Backend/BD/Auth/Storage:** Supabase (PostgreSQL + Auth + Storage)
- **PDF:** jsPDF + jspdf-autotable
- **Biometría:** face-api.js (comparación facial: foto cédula vs cámara en vivo)
- **Package manager:** npm

## Contexto legal y financiero (Ecuador)

### Tasas de interés
- Las tasas de interés activas efectivas máximas son fijadas por la Junta de Política y Regulación Financiera y publicadas mensualmente por el Banco Central del Ecuador (BCE)
- Los segmentos de crédito oficiales del BCE son: Productivo Corporativo (máx 8.23%), Productivo Empresarial (máx 10.44%), Productivo PYMES (máx 10.69%), Consumo Ordinario (máx 16.77%), Consumo Prioritario, Educativo (9.50%), Educativo Social (7.50%), Vivienda de Interés Público/Social (4.99%), Inmobiliario (máx 10.96%), Microcrédito Minorista (máx 28.23%), Microcrédito Acumulación Simple (máx 24.89%), Microcrédito Acumulación Ampliada (máx 22.05%), Inversión Pública (máx 9.33%)
- Estas tasas son de referencia a marzo 2026. El admin puede actualizarlas cuando el BCE publique nuevos valores
- El sistema debe validar que la tasa configurada por el admin NO supere la tasa máxima del segmento correspondiente
- Nota legal obligatoria: "Tasas de interés conforme a la Codificación de Resoluciones Monetarias, Financieras, de Valores y Seguros, Libro I: Sistema Monetario y Financiero, Capítulo XI. Tasas vigentes publicadas por el Banco Central del Ecuador."

### Contribución SOLCA
- Contribución del 0.5% sobre el monto de la operación de crédito, destinada al financiamiento de la atención integral del cáncer
- Base legal: Disposición General Décima Cuarta del Código Orgánico Monetario y Financiero, Resolución No. 003-2014-F de la Junta de Política y Regulación Monetaria y Financiera
- Se calcula el valor total de SOLCA sobre el monto del crédito y luego se DIVIDE en partes iguales entre el número de cuotas
- Para créditos menores a 1 año, se calcula de forma anualizada proporcional al plazo
- Aplica a TODO tipo de crédito en entidades privadas y cooperativas
- NO aplica a instituciones del estado

### Moneda
- Dólar estadounidense (USD), moneda oficial de Ecuador

### Documentos de identidad
- Cédula de identidad ecuatoriana: 10 dígitos, validación con algoritmo módulo 10
- RUC (Registro Único de Contribuyentes): 13 dígitos, requerido para créditos productivos y microcréditos

## Concepto clave: sistema vendible a cualquier institución
El administrador configura TODO: logo, nombre, colores institucionales, slogan, tipos de crédito con subtipos, tasas dentro de rangos legales, cobros indirectos, productos de inversión. El sistema se adapta visualmente según la configuración. Un mismo sistema puede servir para Banco Pichincha (amarillo/negro), ProduBanco (azul), o cualquier cooperativa solo cambiando la configuración.

## LÓGICA FUNDAMENTAL DE COBROS INDIRECTOS (MUY IMPORTANTE)

Todos los cobros indirectos (SOLCA, seguro de desgravamen, seguro de vida, seguro vehicular, donaciones a fundaciones, cualquier cobro adicional) siguen la MISMA lógica:

1. El admin configura el cobro como PORCENTAJE o VALOR FIJO
2. Se calcula el VALOR TOTAL del cobro para todo el crédito
3. Ese valor total se DIVIDE entre el número de cuotas
4. Se agrega como columna en la tabla de amortización con el MISMO valor fijo en cada fila
5. La CUOTA FINAL = cuota base + SOLCA mensual + seguro mensual + otros cobros mensuales

### Ejemplo concreto:
- Crédito: $7,000 a 8 meses al 15% anual
- SOLCA: 0.5% × $7,000 = $35 total → $35 / 8 = $4.38 por cuota
- Seguro desgravamen: admin configuró $700 fijo → $700 / 8 = $87.50 por cuota
- Seguro de vida: admin configuró 1% del monto → 1% × $7,000 = $70 → $70 / 8 = $8.75 por cuota
- Cuota base (francesa): $924.59
- Cuota final: $924.59 + $4.38 + $87.50 + $8.75 = $1,025.22

### La tabla se ve así:
| # | Cuota | SOLCA | Seguro | Vida | Cuota final | Interés | Capital | Saldo |
|---|-------|-------|--------|------|-------------|---------|---------|-------|
| 0 | —     | —     | —      | —    | —           | —       | —       | $7,000.00 |
| 1 | $924.59 | $4.38 | $87.50 | $8.75 | $1,025.22 | $86.92 | $837.67 | $6,162.33 |
| 2 | $924.59 | $4.38 | $87.50 | $8.75 | $1,025.22 | $76.52 | $848.07 | $5,314.26 |

IMPORTANTE: La fila 0 muestra solo el saldo inicial del crédito. Cada cobro indirecto tiene su PROPIA columna. Los valores de cada cobro son IGUALES en todas las filas porque el total se dividió entre las cuotas.

## Estructura de carpetas

simulafinance/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── institucion/page.tsx            # Logo, nombre, colores, slogan, contacto
│   │   ├── tipos-credito/page.tsx          # CRUD tipos + subtipos de crédito
│   │   ├── cobros-indirectos/page.tsx      # Seguros, fundaciones (% o fijo)
│   │   ├── requisitos-credito/page.tsx     # Qué documentos pide cada tipo de crédito
│   │   ├── tasas-referencia/page.tsx       # Tasas BCE con rangos legales + nota legal
│   │   ├── productos-inversion/page.tsx    # Config tipos de inversión
│   │   ├── solicitudes/page.tsx            # Ver/aprobar/rechazar solicitudes
│   │   └── reportes/page.tsx
│   ├── (cliente)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── simulador-credito/page.tsx      # Simular tabla francesa y alemana
│   │   ├── solicitud-credito/page.tsx      # "Me interesa" → solicitud formal
│   │   ├── simulador-inversion/page.tsx    # Simular rendimiento inversión
│   │   ├── solicitud-inversion/page.tsx    # Proceso en línea inversión
│   │   ├── mis-solicitudes/page.tsx        # Estado de mis solicitudes
│   │   └── mis-simulaciones/page.tsx       # Historial de simulaciones guardadas
│   ├── layout.tsx                          # Theme provider con colores dinámicos
│   └── page.tsx                            # Landing con branding de la institución
├── components/
│   ├── ui/                                 # shadcn/ui
│   ├── theme/
│   │   └── ThemeProvider.tsx               # Colores dinámicos desde config institución
│   ├── admin/
│   │   ├── InstitucionForm.tsx             # Logo + nombre + colores + slogan + contacto
│   │   ├── TipoCreditoForm.tsx             # Crear tipo con subtipos
│   │   ├── SubtipoCreditoForm.tsx          # Subtipo con rango monto y plazo min/max
│   │   ├── CobrosIndirectosForm.tsx        # % o fijo, sobre qué base se calcula el total
│   │   ├── RequisitosCredito.tsx           # Qué documentos pide cada tipo
│   │   ├── TasasReferenciaPanel.tsx        # Rangos legales BCE + edición
│   │   ├── ProductoInversionForm.tsx
│   │   └── SolicitudesPanel.tsx            # Aprobar/rechazar solicitudes
│   ├── credito/
│   │   ├── SimuladorForm.tsx               # Tipo → subtipo → monto → plazo → sistema
│   │   ├── TablaAmortizacion.tsx           # Tabla en pantalla con columna por cada cobro
│   │   ├── ResumenCostos.tsx               # Desglose: total de cada cobro + cuota final
│   │   ├── PDFGenerator.tsx                # PDF institucional completo
│   │   └── BotonMeInteresa.tsx             # Inicia solicitud formal
│   ├── inversion/
│   │   ├── SimuladorInversion.tsx          # Tipo, monto, plazo, rendimiento
│   │   └── BotonSolicitarInversion.tsx
│   ├── solicitud/                          # Compartido para crédito e inversión
│   │   ├── FormularioDatosPersonales.tsx
│   │   ├── AnalisisFinanciero.tsx          # Ingresos, gastos, patrimonio, otras deudas
│   │   ├── ValidadorCedula.tsx             # Módulo 10 ecuatoriano
│   │   ├── ValidadorRUC.tsx                # Formato + vigencia
│   │   ├── DocumentUploader.tsx            # Cédula, RUC, comprobantes según requisitos
│   │   ├── ValidacionBiometrica.tsx        # Comparar foto cédula vs cámara
│   │   ├── ResultadoCapacidad.tsx          # "Puedes pagar hasta $X de cuota"
│   │   └── ResumenSolicitud.tsx            # Resumen antes de enviar
│   └── shared/
│       ├── Navbar.tsx                      # Con logo y colores dinámicos
│       ├── Sidebar.tsx
│       ├── ProtectedRoute.tsx
│       └── NotaLegal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── calculos/
│   │   ├── amortizacion-francesa.ts        # Cuota fija
│   │   ├── amortizacion-alemana.ts         # Capital fijo
│   │   ├── cobros-indirectos.ts            # Calcular total de cada cobro → dividir entre cuotas
│   │   ├── capacidad-pago.ts              # Análisis ingresos vs gastos vs deudas (regla 40%)
│   │   └── inversion.ts                   # Rendimiento según tipo y plazo
│   ├── validaciones/
│   │   ├── cedula-ecuatoriana.ts           # Algoritmo módulo 10 (sin restricción de tercer dígito)
│   │   ├── ruc-ecuatoriano.ts             # 3 tipos: natural (mod 10), sociedad privada (mod 11), pública (mod 11)
│   │   └── analisis-financiero.ts         # Reglas capacidad endeudamiento
│   ├── pdf/
│   │   └── generarTablaPDF.ts             # PDF institucional completo con logo, desglose, nota legal
│   ├── theme/
│   │   └── dynamic-colors.ts             # Generar CSS vars desde config institución
│   └── constants/
│       └── tasas-bce.ts                   # Tasas referenciales BCE marzo 2026 + texto legal + resoluciones
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── .env.local

## Schema de base de datos (SQL para Supabase)

-- Instituciones financieras (configurable por admin)
CREATE TABLE instituciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  logo_url TEXT,
  slogan TEXT,
  color_primario VARCHAR(7) DEFAULT '#1a1a2e',
  color_secundario VARCHAR(7) DEFAULT '#16213e',
  color_acento VARCHAR(7) DEFAULT '#0f3460',
  direccion TEXT,
  ciudad VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  sitio_web TEXT,
  ruc_institucion VARCHAR(13),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios con roles
CREATE TABLE usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  institucion_id UUID REFERENCES instituciones(id),
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cedula VARCHAR(10),
  ruc VARCHAR(13),
  telefono VARCHAR(15),
  direccion TEXT,
  rol VARCHAR(20) CHECK (rol IN ('admin', 'cliente')) NOT NULL,
  foto_perfil_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasas referenciales BCE (segmentos oficiales con rangos legales)
CREATE TABLE tasas_referencia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segmento VARCHAR(100) NOT NULL,
  subsegmento VARCHAR(100),
  tasa_referencial DECIMAL(5,2) NOT NULL,
  tasa_maxima DECIMAL(5,2) NOT NULL,
  vigencia_desde DATE NOT NULL,
  vigencia_hasta DATE,
  resolucion_legal TEXT NOT NULL,
  fuente TEXT DEFAULT 'Banco Central del Ecuador',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos de crédito
CREATE TABLE tipos_credito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  segmento_bce VARCHAR(100) NOT NULL,
  tasa_interes_anual DECIMAL(5,2) NOT NULL,
  descripcion TEXT,
  requiere_ruc BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtipos de crédito (ej: hipotecario → primera vivienda, segunda vivienda)
CREATE TABLE subtipos_credito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_credito_id UUID REFERENCES tipos_credito(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  monto_min DECIMAL(12,2) NOT NULL,
  monto_max DECIMAL(12,2) NOT NULL,
  plazo_min_meses INT NOT NULL,
  plazo_max_meses INT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cobros indirectos (por tipo de crédito o globales)
-- LÓGICA: el admin configura tipo_cobro y valor. El sistema calcula el TOTAL
-- y luego lo DIVIDE entre el número de cuotas para obtener el valor mensual fijo.
CREATE TABLE cobros_indirectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  tipo_credito_id UUID REFERENCES tipos_credito(id) ON DELETE SET NULL,
  nombre VARCHAR(100) NOT NULL,               -- "SOLCA", "Seguro desgravamen", "Seguro de vida", "Seguro vehicular", "Donación fundación X"
  tipo_cobro VARCHAR(20) CHECK (tipo_cobro IN ('porcentaje', 'fijo')) NOT NULL,
  valor DECIMAL(10,4) NOT NULL,               -- si porcentaje: ej 0.50 para 0.5%. Si fijo: ej 700.00 para $700
  base_calculo VARCHAR(30) DEFAULT 'monto_credito'
    CHECK (base_calculo IN ('monto_credito', 'valor_bien')),
    -- monto_credito: el % se aplica sobre el monto del crédito
    -- valor_bien: el % se aplica sobre el valor del bien (ej: seguro vehicular sobre precio del auto)
    -- Si tipo_cobro = 'fijo', base_calculo se ignora (el valor ya es el total en USD)
  obligatorio BOOLEAN DEFAULT true,
  es_global BOOLEAN DEFAULT false,            -- true = aplica a todos los créditos (ej: SOLCA)
  es_solca BOOLEAN DEFAULT false,             -- true = es la contribución SOLCA (lógica especial para < 1 año)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requisitos por tipo de crédito (qué documentos se piden)
CREATE TABLE requisitos_credito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_credito_id UUID REFERENCES tipos_credito(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  obligatorio BOOLEAN DEFAULT true,
  tipo_archivo VARCHAR(20) DEFAULT 'documento'
    CHECK (tipo_archivo IN ('documento', 'imagen', 'cedula', 'ruc')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Análisis financiero del cliente
CREATE TABLE analisis_financiero (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  ingresos_mensuales DECIMAL(12,2) NOT NULL,
  gastos_mensuales DECIMAL(12,2) NOT NULL,
  otros_creditos_cuota DECIMAL(12,2) DEFAULT 0,
  patrimonio DECIMAL(12,2) DEFAULT 0,
  descripcion_ingresos TEXT,
  descripcion_patrimonio TEXT,
  capacidad_pago_mensual DECIMAL(12,2),
  porcentaje_endeudamiento DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de simulaciones
CREATE TABLE simulaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  tipo_credito_id UUID REFERENCES tipos_credito(id),
  subtipo_credito_id UUID REFERENCES subtipos_credito(id),
  monto DECIMAL(12,2) NOT NULL,
  valor_bien DECIMAL(12,2),
  plazo_meses INT NOT NULL,
  tasa_aplicada DECIMAL(5,2) NOT NULL,
  sistema_amortizacion VARCHAR(10) CHECK (sistema_amortizacion IN ('francesa', 'alemana')) NOT NULL,
  cuota_base DECIMAL(12,2) NOT NULL,
  cuota_final DECIMAL(12,2) NOT NULL,         -- cuota base + todos los cobros mensualizados
  total_a_pagar DECIMAL(12,2) NOT NULL,
  total_intereses DECIMAL(12,2) NOT NULL,
  tabla_json JSONB NOT NULL,
  cobros_desglose_json JSONB NOT NULL,         -- [{nombre, total, mensual}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes de crédito
CREATE TABLE solicitudes_credito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  simulacion_id UUID REFERENCES simulaciones(id),
  tipo_credito_id UUID REFERENCES tipos_credito(id),
  subtipo_credito_id UUID REFERENCES subtipos_credito(id),
  analisis_financiero_id UUID REFERENCES analisis_financiero(id),
  monto DECIMAL(12,2) NOT NULL,
  valor_bien DECIMAL(12,2),
  plazo_meses INT NOT NULL,
  tasa_aplicada DECIMAL(5,2) NOT NULL,
  cuota_base DECIMAL(12,2) NOT NULL,
  cuota_final DECIMAL(12,2) NOT NULL,
  sistema_amortizacion VARCHAR(10) CHECK (sistema_amortizacion IN ('francesa', 'alemana')) NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'documentos', 'analisis', 'biometria', 'en_revision', 'aprobada', 'rechazada')),
  cedula_url TEXT,
  ruc_url TEXT,
  documentos_adicionales_json JSONB,
  selfie_url TEXT,
  biometria_validada BOOLEAN DEFAULT false,
  cuota_maxima_sugerida DECIMAL(12,2),
  motivo_rechazo TEXT,
  observaciones_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos de inversión
CREATE TABLE productos_inversion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institucion_id UUID REFERENCES instituciones(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  tipo_inversion VARCHAR(50) NOT NULL
    CHECK (tipo_inversion IN ('plazo_fijo', 'ahorro_programado', 'ahorro_objetivo')),
  tasa_interes_anual DECIMAL(5,2) NOT NULL,
  plazo_min_dias INT NOT NULL,
  plazo_max_dias INT NOT NULL,
  monto_min DECIMAL(12,2) NOT NULL,
  monto_max DECIMAL(12,2),
  frecuencia_aporte VARCHAR(20) DEFAULT 'unico'
    CHECK (frecuencia_aporte IN ('unico', 'mensual', 'trimestral', 'semestral', 'anual')),
  objetivo VARCHAR(100),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes de inversión
CREATE TABLE solicitudes_inversion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  producto_id UUID REFERENCES productos_inversion(id),
  monto DECIMAL(12,2) NOT NULL,
  plazo_dias INT NOT NULL,
  rendimiento_estimado DECIMAL(12,2),
  aporte_periodico DECIMAL(12,2),
  estado VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'documentos', 'biometria', 'en_revision', 'aprobada', 'rechazada')),
  documento_identidad_url TEXT,
  selfie_url TEXT,
  biometria_validada BOOLEAN DEFAULT false,
  observaciones_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasas_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtipos_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros_indirectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis_financiero ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_inversion ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_inversion ENABLE ROW LEVEL SECURITY;

## Lógica de cálculos financieros

### Amortización francesa (cuota fija)
cuota = monto × [r(1+r)^n] / [(1+r)^n - 1]
donde r = tasa mensual (tasa anual / 12 / 100), n = número de cuotas
- Interés del período = saldo × r
- Capital del período = cuota - interés
- Saldo = saldo anterior - capital
- La cuota base es FIJA en todas las filas

### Amortización alemana (capital fijo)
capital_fijo = monto / n
- Interés del período = saldo × r
- Cuota base = capital_fijo + interés (va disminuyendo cada mes)
- Saldo = saldo anterior - capital_fijo

### Cobros indirectos (archivo: cobros-indirectos.ts)

TODOS los cobros siguen la misma lógica de 3 pasos:

Paso 1 — Calcular el TOTAL del cobro para todo el crédito:
- Si tipo_cobro = 'porcentaje' y base_calculo = 'monto_credito':
  total = (valor / 100) × monto_credito
  Ejemplo: SOLCA 0.5% sobre $7,000 = $35
  Ejemplo: Seguro de vida 1% sobre $7,000 = $70
- Si tipo_cobro = 'porcentaje' y base_calculo = 'valor_bien':
  total = (valor / 100) × valor_del_bien
  Ejemplo: Seguro vehicular 10% sobre auto de $15,000 = $1,500
- Si tipo_cobro = 'fijo':
  total = valor (ya es el monto total en USD)
  Ejemplo: Seguro desgravamen = $700

Paso 2 — Caso especial SOLCA (si es_solca = true):
- Si plazo > 12 meses: total = monto × 0.005 (se cobra el 0.5% completo)
- Si plazo <= 12 meses: total = monto × 0.005 × (plazo_meses / 12) (proporcional)

Paso 3 — Dividir el total entre el número de cuotas:
  cobro_mensual = total / plazo_meses
  Este valor es FIJO e IGUAL en todas las filas de la tabla

### Construcción de la tabla de amortización

La fila 0 solo muestra el saldo inicial.
Para cada fila i (1 a n):
- Cuota base = según sistema (francesa: fija / alemana: variable)
- Interés = saldo × tasa_mensual
- Capital = cuota base - interés (francesa) o capital_fijo (alemana)
- Saldo = saldo anterior - capital
- Columna por cada cobro indirecto = valor mensual fijo (total ÷ n)
- Cuota final = cuota base + suma de todos los cobros mensuales

### Estructura del resultado (cobros_desglose_json):
[
  { "nombre": "SOLCA", "total": 35.00, "mensual": 4.38 },
  { "nombre": "Seguro desgravamen", "total": 700.00, "mensual": 87.50 },
  { "nombre": "Seguro de vida", "total": 70.00, "mensual": 8.75 }
]

### Capacidad de pago
- capacidad_mensual = ingresos - gastos - cuotas_otros_creditos
- porcentaje_endeudamiento = ((cuotas_existentes + cuota_final_nueva) / ingresos) × 100
- Regla: endeudamiento no debe superar 40% de ingresos
- Mensaje: "Tu capacidad máxima de cuota mensual es $X"
- Si cuota_final > capacidad_mensual → alerta y bloquear solicitud
- IMPORTANTE: la validación se hace contra la CUOTA FINAL (que incluye todos los cobros), no contra la cuota base

### Validación cédula ecuatoriana (módulo 10)
- 10 dígitos exactos
- Primeros 2 dígitos = código provincia (01 a 24, o 30 para ecuatorianos en el exterior)
- Tercer dígito: típicamente 0-5 para personas naturales, pero EXISTEN cédulas válidas con tercer dígito 6 (emitidas por el Registro Civil). NO rechazar por este criterio
- RECOMENDACIÓN: validar SOLO con el algoritmo del dígito verificador (módulo 10), no filtrar por tercer dígito
- Se aplican coeficientes [2,1,2,1,2,1,2,1,2] a los primeros 9 dígitos
- Si el producto es mayor a 9, se resta 9
- Se suman los resultados
- dígito verificador = si (10 - suma%10) == 10 entonces 0, sino (10 - suma%10)
- Se compara con el décimo dígito de la cédula

### Validación RUC ecuatoriano
- 13 dígitos exactos
- Los últimos 3 dígitos NO pueden ser "000"
- Tres tipos de RUC:
  1. Persona natural: tercer dígito 0-5 (o 6 en casos especiales), primeros 10 dígitos = cédula válida (módulo 10, verificador en posición 10), últimos 3 = "001" o superior
  2. Sociedad privada/extranjeros sin cédula: tercer dígito = 9, se valida con módulo 11, coeficientes [4,3,2,7,6,5,4,3,2], dígito verificador en posición 10, últimos 3 = "001" o superior
  3. Institución pública: tercer dígito = 6, se valida con módulo 11, coeficientes [3,2,7,6,5,4,3,2], dígito verificador en posición 9, últimos 4 = "0001" o superior

### Inversiones
- Plazo fijo (interés simple): rendimiento = monto × (tasa/100) × (plazo_dias/365)
- Ahorro programado: rendimiento acumulado por cada aporte periódico con interés compuesto
- Ahorro con objetivo: proyección de aportes necesarios para alcanzar meta
- Mostrar: monto invertido, rendimiento estimado, total a recibir, fecha de vencimiento

## Generación de PDF institucional completo
El PDF debe incluir:
1. Encabezado: Logo de la institución + nombre + slogan (colores institucionales)
2. Datos de la institución: dirección, teléfono, email, sitio web
3. Línea separadora
4. Datos del cliente: nombre completo, cédula
5. Fecha y hora de generación del documento
6. Tipo de crédito, subtipo, sistema de amortización (francesa/alemana)
7. Condiciones: monto solicitado, valor del bien (si aplica), plazo, tasa de interés anual y mensual
8. Resumen de cobros indirectos: tabla con nombre del cobro, tipo (% o fijo), valor total, valor mensual por cuota
9. Tabla de amortización completa: N° cuota, cuota base, [columna por cada cobro indirecto con su valor mensual fijo], cuota final, interés, capital, saldo
10. Fila 0 al inicio con solo el saldo inicial
11. Fila de totales al final: suma de intereses, suma de capital, suma de cada cobro, suma de cuotas finales
12. Resumen final: total capital, total intereses, total por cada cobro indirecto, COSTO TOTAL DEL CRÉDITO
13. Nota legal: "Tasas de interés conforme a la Codificación de Resoluciones Monetarias, Financieras, de Valores y Seguros. Contribución SOLCA según Disposición General Décima Cuarta del Código Orgánico Monetario y Financiero. Los valores son referenciales y están sujetos a análisis crediticio."
14. Pie de página: "Documento generado por SimulaFinance — [fecha] — Este documento no constituye una aprobación de crédito"

## Colores dinámicos (tema institucional)
El admin configura color_primario, color_secundario y color_acento en hex.
El ThemeProvider genera CSS variables:
--color-inst-primary, --color-inst-secondary, --color-inst-accent
Más variantes automáticas: --color-inst-primary-light, --color-inst-primary-dark
Navbar, sidebar, botones principales, landing page, y encabezado del PDF usan estos colores.

## Flujo completo del cliente para créditos
1. Ve landing page con branding de la institución
2. Se registra / inicia sesión como cliente
3. Entra al simulador de crédito
4. Selecciona tipo de crédito → se cargan subtipos disponibles
5. Selecciona subtipo → se cargan rangos de monto y plazo permitidos
6. Ingresa monto (validado contra min/max del subtipo)
7. Si aplica, ingresa valor del bien (para cobros sobre valor_bien)
8. Selecciona plazo en meses (validado contra min/max)
9. Elige sistema de amortización: francesa o alemana
10. Se genera la tabla en pantalla con:
    - Fila 0 con saldo inicial
    - Tabla de amortización con columna por cada cobro indirecto
    - Cuota final = cuota base + todos los cobros mensualizados
    - Fila de totales al final
    - Resumen: total de cada cobro, total intereses, costo total del crédito
11. Puede descargar PDF institucional completo
12. La simulación se guarda automáticamente en su historial
13. Si le interesa → botón "Me interesa / Solicitar crédito"
14. Se carga formulario de datos personales (nombre, cédula, dirección, teléfono)
15. Completa análisis financiero: ingresos mensuales, gastos mensuales, cuotas de otros créditos, patrimonio, fuente de ingresos
16. Sistema calcula capacidad de pago → muestra "Tu capacidad máxima de cuota es $X"
17. Si cuota FINAL > capacidad → alerta clara, no deja continuar
18. Sube documentos según requisitos del tipo de crédito (cédula obligatoria, RUC si requiere, otros docs configurados por admin)
19. Sistema valida formato de cédula y RUC automáticamente
20. Validación biométrica: toma foto con cámara, compara con foto de cédula subida
21. Resumen completo de la solicitud antes de enviar
22. Envía solicitud
23. Admin recibe, revisa y aprueba/rechaza con observaciones

## Flujo del cliente para inversiones
1. Selecciona producto de inversión (plazo fijo, ahorro programado, ahorro objetivo)
2. Ingresa monto y plazo
3. Si es ahorro programado: ingresa aporte periódico
4. Si es ahorro objetivo: ingresa meta y sistema calcula aportes necesarios
5. Ve simulación de rendimiento
6. Si le interesa → solicitud con documentos y biometría
7. Admin aprueba/rechaza

## Lo que necesito que hagas AHORA:

1. Inicializa el proyecto Next.js con TypeScript y Tailwind
2. Instala dependencias: @supabase/supabase-js, @supabase/ssr, jspdf, jspdf-autotable, face-api.js
3. Configura shadcn/ui con componentes: button, input, select, table, card, dialog, tabs, badge, label, alert, separator, sheet, dropdown-menu, avatar, progress, toast
4. Crea la estructura de carpetas completa como se muestra arriba
5. Genera el archivo de migración SQL completo con TODAS las tablas
6. Implementa lib/calculos/amortizacion-francesa.ts y amortizacion-alemana.ts con las fórmulas. Ambas deben devolver un array de filas con: numero, cuota_base, interes, capital, saldo
7. Implementa lib/calculos/cobros-indirectos.ts con la lógica de 3 pasos: calcular total → caso especial SOLCA → dividir entre cuotas. Debe recibir el array de cobros configurados, el monto, valor_bien, y plazo, y devolver [{nombre, total, mensual}]
8. La función que genera la tabla final debe combinar la amortización + los cobros: agregar las columnas de cobros mensuales fijos a cada fila y calcular cuota_final = cuota_base + suma_cobros_mensuales
9. Implementa lib/calculos/capacidad-pago.ts con la regla del 40% validando contra la cuota FINAL
10. Implementa lib/calculos/inversion.ts con interés simple, ahorro programado y ahorro objetivo
11. Implementa lib/validaciones/cedula-ecuatoriana.ts con el algoritmo módulo 10 completo (sin restricción de tercer dígito, validar solo por dígito verificador, aceptar provincias 01-24 y 30)
12. Implementa lib/validaciones/ruc-ecuatoriano.ts con los 3 tipos: persona natural (módulo 10, verificador posición 10), sociedad privada (tercer dígito 9, módulo 11, coeficientes [4,3,2,7,6,5,4,3,2], verificador posición 10), institución pública (tercer dígito 6, módulo 11, coeficientes [3,2,7,6,5,4,3,2], verificador posición 9)
13. Crea lib/constants/tasas-bce.ts con los segmentos oficiales del BCE (marzo 2026), tasas máximas reales, y textos legales de las resoluciones
14. Crea lib/theme/dynamic-colors.ts para generar CSS variables + variantes claras/oscuras desde los colores hex del admin
15. Crea types/index.ts con TODAS las interfaces: Institucion, Usuario, TipoCredito, SubtipoCredito, CobroIndirecto, RequisitoCredito, AnalisisFinanciero, Simulacion, SolicitudCredito, ProductoInversion, SolicitudInversion, TablaAmortizacionRow, CobroDesglose, ResumenCredito, ConfigPDF, TasaReferencia
16. Configura cliente Supabase (browser + server) con tipado
17. Crea middleware de autenticación que proteja rutas /admin y /cliente según rol
18. Implementa ThemeProvider.tsx que lea colores de la institución desde Supabase y los aplique como CSS variables
19. Genera TODAS las páginas con placeholder detallado: qué va en cada una, qué componentes usará, qué datos necesita
20. Crea NotaLegal.tsx reutilizable con textos legales parametrizados

NO implementes toda la UI todavía. Solo la estructura completa, todos los cálculos funcionando, todas las validaciones, el theme provider, los types, y páginas placeholder con comentarios claros. El equipo se repartirá los módulos después.