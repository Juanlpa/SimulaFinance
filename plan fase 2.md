# Plan Fase 2 — SimulaFinance: Implementación de UI y Funcionalidad Completa

## Estado de entrada

La Fase 1 está 100% completa:
- ✅ Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui instalados
- ✅ 12 tablas en Supabase con RLS + 14 tasas BCE insertadas
- ✅ Todos los módulos de cálculo financiero (`lib/calculos/`)
- ✅ Validaciones ecuatorianas (`lib/validaciones/`)
- ✅ Generador PDF institucional (`lib/pdf/generarTablaPDF.ts`)
- ✅ Theme dinámico por institución (`lib/theme/dynamic-colors.ts`)
- ✅ Middleware de autenticación y roles
- ✅ ~20 páginas placeholder con TODOs detallados
- ✅ `.env.local` con credenciales reales de Supabase

---

## Resumen de fases

| Fase | Contenido | Páginas/Componentes |
|------|-----------|---------------------|
| 2.1 | Auth — Login y Registro | 2 páginas |
| 2.2 | Simulador de Crédito (core) | 5 componentes + 1 página |
| 2.3 | Solicitud de Crédito multi-paso | 5 pasos + biometría |
| 2.4 | Panel Admin — Institución y Tema | 1 página + preview |
| 2.5 | Panel Admin — Tipos, Cobros, Requisitos | 3 páginas CRUD |
| 2.6 | Panel Admin — Solicitudes y Dashboard | 2 páginas |
| 2.7 | Simulador de Inversión + Solicitud | 2 páginas |
| 2.8 | Panel Cliente — Dashboard, Mis solicitudes, Mis simulaciones | 3 páginas |
| 2.9 | Admin — Tasas BCE, Productos inversión, Reportes | 3 páginas |
| 2.10 | Supabase Storage — buckets y upload | infraestructura |
| 2.11 | Pruebas de integración y ajustes finales | QA |

---

## Fase 2.1 — Auth: Login y Registro

### Objetivo
Implementar autenticación real con Supabase Auth. El middleware ya protege las rutas; solo falta conectar los formularios.

### 2.1.1 `app/login/page.tsx` — Login funcional

**Convertir a componente 'use client' con estado:**
```
estado: { email, password, loading, error }
```

**Flujo:**
1. `supabase.auth.signInWithPassword({ email, password })`
2. Si error → mostrar mensaje de error en alerta roja
3. Si éxito → leer `usuarios.rol` → redirigir con `router.push()`
   - rol 'admin' → `/admin/dashboard`
   - rol 'cliente' → `/cliente/dashboard`

**Componentes shadcn/ui a usar:**
- `Card`, `CardHeader`, `CardContent` para el contenedor
- `Input` + `Label` para email y password
- `Button` con estado `disabled={loading}`
- `Alert` con variante `destructive` para errores
- Ícono de ojo para toggle password (usar estado `showPassword`)

**Detalles UI:**
- Logo institucional dinámico desde `useInstitucion()` (si disponible) o inicial "S"
- El color del botón usa `var(--color-inst-primary)`
- Link "¿Olvidaste tu contraseña?" → `/reset-password` (placeholder por ahora)
- Link "Regístrate" → `/registro`
- Loading spinner en el botón mientras `loading === true`

---

### 2.1.2 `app/registro/page.tsx` — Registro funcional

**Flujo completo:**
1. Formulario con: nombre, apellido, email, contraseña, confirmar contraseña
2. Validar que contraseñas coincidan (client-side)
3. `supabase.auth.signUp({ email, password, options: { data: { nombre, apellido } } })`
4. El trigger `handle_new_user()` en la BD crea automáticamente la fila en `usuarios`
5. Si éxito → mostrar mensaje "Revisa tu correo para confirmar tu cuenta"
6. Redirigir a `/login` tras 3 segundos

**Validaciones client-side:**
- Email formato válido
- Contraseña mínimo 8 caracteres
- Contraseñas deben coincidir
- Todos los campos requeridos

**Componentes:** igual que login + campo `confirmPassword`

---

## Fase 2.2 — Simulador de Crédito (módulo principal)

### Objetivo
Implementar el corazón del sistema. Un usuario selecciona parámetros y obtiene la tabla de amortización completa con cobros indirectos, resumen financiero y botón de descarga PDF.

### Componentes a crear en `components/credito/`

---

#### 2.2.1 `components/credito/SimuladorForm.tsx`

**Props:**
```typescript
interface SimuladorFormProps {
  onCalcular: (params: ParamsSimulador) => void
  loading: boolean
}

interface ParamsSimulador {
  tipoCreditoId: string
  subtipoCreditoId: string
  monto: number
  valorBien: number | null
  plazoMeses: number
  sistema: SistemaAmortizacion
}
```

**Campos del formulario (en orden):**
1. **Select "Tipo de crédito"** — carga desde `tipos_credito WHERE activo = true AND institucion_id = ...`
   - Al cambiar: cargar subtipos del tipo seleccionado, resetear subtipo/monto/plazo
2. **Select "Subtipo"** — carga desde `subtipos_credito WHERE tipo_credito_id = ... AND activo = true`
   - Al cambiar: actualizar `montoMin`, `montoMax`, `plazoMinMeses`, `plazoMaxMeses` desde el subtipo
3. **Input "Monto solicitado"** — tipo número, prefijo `$`
   - Validar: `monto_min <= valor <= monto_max`
   - Mostrar hint: "Entre $X y $Y"
4. **Input "Valor del bien"** *(condicional)* — visible solo si algún cobro del tipo tiene `base_calculo = 'valor_bien'`
   - Determinar esto al seleccionar el tipo de crédito
5. **Input o Select "Plazo"** — en meses
   - Validar: `plazo_min_meses <= valor <= plazo_max_meses`
   - Mostrar hint: "Entre X y Y meses"
6. **RadioGroup "Sistema de amortización"**
   - Opción A: "Francesa (cuota fija)" — explicación breve al hover
   - Opción B: "Alemana (capital fijo)" — explicación breve al hover
7. **Botón "Calcular"** — `disabled` si hay errores de validación
   - Color `var(--color-inst-primary)`
   - Spinner cuando `loading === true`

**Lógica interna:**
- Al seleccionar tipo: fetch en paralelo de subtipos + cobros indirectos del tipo
- Guardar cobros en estado para pasarlos junto al cálculo
- Validación reactiva: mostrar bordes rojos + mensaje bajo el campo

---

#### 2.2.2 `components/credito/TablaAmortizacion.tsx`

**Props:**
```typescript
interface TablaAmortizacionProps {
  filas: TablaAmortizacionRow[]
  cobrosDesglose: CobroDesglose[]
  sistema: SistemaAmortizacion
}
```

**Estructura de la tabla:**
- Columnas dinámicas: `# | Cuota base | [cobro1] | [cobro2] | ... | Cuota final | Interés | Capital | Saldo`
- Las columnas de cobros se generan a partir de `cobrosDesglose.map(c => c.nombre)`
- **Fila 0:** `# = 0`, todas las celdas `—` excepto `Saldo = $X.XX`
- **Filas 1..n:** todos los campos numéricos formateados `$X.XX`
- **Fila de totales** (última, fondo secundario): suma de cada columna
- Fila de totales usa `cobrosDesglose[i].total` (ya calculado), no suma columna

**UI/UX:**
- Contenedor con `overflow-x-auto` para tablas anchas
- Alternar color de filas pares/impares (`striped`)
- Fila 0 con fondo ligeramente diferente (es la fila de "desembolso")
- Fila de totales con `font-bold` y fondo `var(--color-inst-secondary)`
- Si `plazo_meses > 24`: mostrar paginación (25 filas por página) con botones anterior/siguiente
- Número de cuotas visible: "Mostrando cuotas 1-25 de N"

---

#### 2.2.3 `components/credito/ResumenCostos.tsx`

**Props:**
```typescript
interface ResumenCostosProps {
  resumen: ResumenCredito
}
```

**Layout (3 columnas en desktop, 1 en móvil):**

Columna 1 — Estructura del crédito:
- Monto solicitado: `$X`
- Plazo: `N meses`
- Tasa anual: `X.XX%`
- Sistema: `Francés / Alemán`

Columna 2 — Por cuota:
- Cuota base: `$X.XX` (primera cuota en alemana, única en francesa)
- Cobros adicionales por cuota: `$X.XX`
- **Cuota final: `$X.XX`** (destacado, color primario)

Columna 3 — Totales del crédito:
- Total capital: `$X.XX`
- Total intereses: `$X.XX`
- Por cada cobro: `Total [nombre]: $X.XX`
- **Costo total: `$X.XX`** (destacado, fuente grande)

---

#### 2.2.4 `components/credito/PDFGenerator.tsx`

**Props:**
```typescript
interface PDFGeneratorProps {
  config: ConfigPDF
  disabled: boolean
}
```

**Lógica:**
- Botón "Descargar PDF" que llama `generarTablaPDF(config)` (importación dinámica)
- `config` se construye en la página padre con todos los datos disponibles
- Estado `generando: boolean` para el spinner
- La función es `async`, manejar errores con try/catch

**Detalle de `ConfigPDF`:**
- `institucion`: desde `useInstitucion()` o fetch desde Supabase
- `usuario`: nombre, apellido, cédula del usuario autenticado
- `fecha_generacion`: `new Date().toLocaleDateString('es-EC')`
- Todo lo demás: desde el estado del simulador

---

#### 2.2.5 `components/credito/BotonMeInteresa.tsx`

**Props:**
```typescript
interface BotonMeInteresaProps {
  simulacionId: string | null  // null si no se ha guardado aún
  disabled: boolean
}
```

**Lógica:**
1. Al hacer clic: si `simulacionId` existe, navegar a `/cliente/solicitud-credito?simulacion=${simulacionId}`
2. La solicitud de crédito leerá el `simulacionId` para pre-cargar datos

---

### 2.2.6 `app/cliente/simulador-credito/page.tsx` — Integración

**Estado de la página:**
```typescript
const [resultado, setResultado] = useState<ResultadoTablaCompleta | null>(null)
const [params, setParams] = useState<ParamsSimulador | null>(null)
const [simulacionId, setSimulacionId] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
const [cobros, setCobros] = useState<CobroIndirecto[]>([])
```

**Flujo al calcular:**
1. Llamar `generarTablaCompleta(params)` — función local, sin servidor
2. `setResultado(tablaCompleta)`
3. Guardar en Supabase `INSERT INTO simulaciones` con los datos
4. `setSimulacionId(data.id)`
5. Mostrar tabla + resumen + botones PDF y "Me interesa"

**Layout:**
```
[SimuladorForm]          [TablaAmortizacion]
1/3 ancho               2/3 ancho

[ResumenCostos — 100% ancho]
[PDFGenerator] [BotonMeInteresa] — alineados a la derecha
[NotaLegal tipo="completo"]
```

---

## Fase 2.3 — Solicitud de Crédito (flujo multi-paso)

### Objetivo
Implementar el proceso formal de solicitud con 5 pasos secuenciales, guardando el progreso en Supabase en cada paso.

### Componente raíz: `app/cliente/solicitud-credito/page.tsx`

**Estado global del flujo:**
```typescript
const [pasoActual, setPasoActual] = useState(1)
const [solicitudId, setSolicitudId] = useState<string | null>(null)
const [simulacionData, setSimulacionData] = useState<Simulacion | null>(null)
const [analisisId, setAnalisisId] = useState<string | null>(null)
```

**Si llega con `?simulacion=id`:** cargar datos de la simulación para pre-poblar.

**Indicador de progreso (Progress bar):**
- 5 pasos: Datos Personales → Análisis → Documentos → Biometría → Confirmación
- Barra de progreso shadcn `<Progress value={(pasoActual / 5) * 100} />`
- Puntos numerados con estado: completado (✓ verde), activo (número azul), pendiente (gris)

---

#### Paso 1 — `components/solicitud/FormularioDatosPersonales.tsx`

**Campos:**
- Nombre (pre-llenado desde `user.user_metadata.nombre`)
- Apellido (pre-llenado desde `user.user_metadata.apellido`)
- Cédula — con validación en tiempo real llamando a `validarCedula()`:
  - Borde rojo + mensaje de error si inválida
  - Borde verde + ✓ si válida
- RUC *(condicional: visible si `tipo_credito.requiere_ruc === true`)*:
  - Validación con `validarRUC()` en tiempo real
- Teléfono — validar 10 dígitos
- Dirección — campo de texto libre

**Al enviar paso 1:**
```sql
INSERT INTO solicitudes_credito (
  usuario_id, tipo_credito_id, subtipo_credito_id,
  monto, plazo_meses, tasa_aplicada, sistema_amortizacion,
  cuota_base, cuota_final, simulacion_id, estado
) VALUES (..., 'pendiente')
```
Guardar `solicitudId` en estado → avanzar a paso 2.

**También:** `UPDATE usuarios SET cedula, telefono, direccion WHERE id = user.id`

---

#### Paso 2 — `components/solicitud/AnalisisFinanciero.tsx`

**Campos:**
- Ingresos mensuales (número, `$`)
- Gastos mensuales (número, `$`)
- Cuotas de otros créditos vigentes (número, `$`)
- Patrimonio (número, `$`)
- Descripción de ingresos (textarea)

**Cálculo en tiempo real (al cambiar cualquier campo):**
```typescript
const resultado = calcularCapacidadPago(
  ingresos, gastos, cuotasOtros, cuota_final_simulacion
)
```

**Mostrar resultado:**
- `ResultadoCapacidadPanel`:
  - "Tu capacidad máxima de cuota: **$X.XX**"
  - "Porcentaje de endeudamiento actual: X.X%"
  - "Con este crédito: X.X% de endeudamiento"
  - Si `puede_pagar === false`: Alert rojo bloqueante "No cumples la capacidad de pago mínima requerida. Tu cuota máxima permitida es $X."
  - Si `puede_pagar === true`: Alert verde "Tu perfil financiero califica para esta cuota."

**Al enviar paso 2:**
```sql
INSERT INTO analisis_financiero (...) → obtener analisis_id
UPDATE solicitudes_credito SET analisis_financiero_id = analisis_id, estado = 'documentos'
```
→ avanzar a paso 3.

---

#### Paso 3 — `components/solicitud/DocumentUploader.tsx`

**Documentos requeridos:**
1. **Cédula de identidad** (siempre obligatorio) — tipo `cedula`
2. **RUC** (si `tipo_credito.requiere_ruc`) — tipo `ruc`
3. **Documentos adicionales** — cargados desde `requisitos_credito WHERE tipo_credito_id = ...`

**Por cada documento:**
- Área de drag-and-drop o botón "Subir archivo"
- Formatos aceptados según `tipo_archivo` (imagen/PDF)
- Preview de imagen si es foto
- Indicador de subida: ProgressBar durante upload
- Estado: pendiente / subiendo / ✓ subido / ✗ error

**Destino en Supabase Storage:**
```
bucket: solicitudes-docs
ruta: {solicitud_id}/cedula.jpg
ruta: {solicitud_id}/ruc.pdf
ruta: {solicitud_id}/{requisito_nombre}.pdf
```

**Al completar todos los documentos obligatorios:**
```sql
UPDATE solicitudes_credito SET
  cedula_url = '...', ruc_url = '...',
  documentos_adicionales_json = {...},
  estado = 'biometria'
```
→ avanzar a paso 4.

**Bucket a crear en Supabase (Fase 2.10):** `solicitudes-docs` (privado)

---

#### Paso 4 — `components/solicitud/ValidacionBiometrica.tsx`

**Tecnología:** `face-api.js` (ya instalado)

**Flujo:**
1. Extraer la foto del rostro de la cédula subida en el paso 3
   - Usando `face-api.js`: `detectSingleFace(cedulaImageElement).withFaceLandmarks().withFaceDescriptor()`
2. Activar cámara del dispositivo: `getUserMedia({ video: true })`
3. Mostrar `<video>` en vivo con overlay de guía (óvalo centrado)
4. Botón "Tomar foto" → capturar frame del video
5. Detectar rostro en la foto capturada con `face-api.js`
6. Calcular distancia euclidiana entre descriptores:
   - `const distancia = faceapi.euclideanDistance(descriptor1, descriptor2)`
   - Umbral configurado: `distancia <= 0.6` → match (60% similitud)
7. Si match:
   - Alert verde "Validación biométrica exitosa"
   - `UPDATE solicitudes_credito SET selfie_url = '...', biometria_validada = true, estado = 'en_revision'`
8. Si no match:
   - Alert rojo "No se pudo verificar tu identidad. Intenta nuevamente."
   - Botón "Reintentar" (hasta 3 intentos)
   - Tras 3 intentos fallidos: "Por favor acércate a una sucursal para verificación presencial."

**Modelos de face-api.js a cargar:**
- `ssdMobilenetv1` o `tinyFaceDetector` (más liviano)
- `faceLandmark68Net`
- `faceRecognitionNet`
- Alojar los modelos en `public/models/` (copiar de `node_modules/face-api.js/weights/`)

**Nota:** Carga los modelos una sola vez con `Promise.all([ faceapi.nets.X.loadFromUri('/models') ])`. Mostrar spinner "Cargando modelos de reconocimiento..." mientras cargan.

---

#### Paso 5 — `components/solicitud/ResumenSolicitud.tsx`

**Contenido:**
- Resumen de datos personales del paso 1
- Resultado del análisis financiero del paso 2
- Lista de documentos subidos con ✓
- Estado de validación biométrica: ✓ o ✗
- Tabla de amortización resumida (solo primeras 3 cuotas + fila de totales)
- Resumen financiero: cuota mensual, total a pagar

**Botón "Enviar solicitud formal":**
- Deshabilitado si biometría no fue validada
- Al hacer clic: mostrar Dialog de confirmación
- Confirmar → `UPDATE solicitudes_credito SET estado = 'en_revision'`
- Redirigir a `/cliente/mis-solicitudes` con mensaje de éxito (toast)

---

## Fase 2.4 — Admin: Configuración de la Institución

### `app/admin/institucion/page.tsx` + `components/admin/InstitucionForm.tsx`

**Sección 1 — Identidad:**
- Input "Nombre de la institución"
- Input "Slogan"
- Upload de logo:
  - `<input type="file" accept="image/*">`
  - Preview circular del logo actual
  - Al subir: `supabase.storage.from('logos').upload(...)` → obtener URL pública
  - Mostrar progreso de subida
- Input "RUC de la institución" — con validación `validarRUC()`

**Sección 2 — Colores (la más importante):**
- Por cada color (primario, secundario, acento):
  - `<input type="color">` nativo para el selector visual
  - Input de texto con el código HEX actualizado en tiempo real
  - Preview: rectángulo de color + variantes light y dark auto-generadas
- **Preview del tema en tiempo real:**
  - Mini Navbar simulado con los colores seleccionados
  - Botón de ejemplo con el color primario
  - Al cambiar colores: llamar `generateCSSVars()` e inyectar en `document.documentElement`

**Sección 3 — Contacto:**
- Dirección, ciudad, teléfono, email (validar formato), sitio web

**Botón "Guardar cambios":**
- `UPDATE instituciones SET ... WHERE id = institucion_id`
- Si hay logo nuevo: ya se subió en el paso anterior, solo guardar la URL
- Toast de éxito/error

**Carga inicial:** `SELECT * FROM instituciones WHERE id = ?` — si no existe, botón "Crear institución"

---

## Fase 2.5 — Admin: Tipos de Crédito, Cobros Indirectos, Requisitos

### 2.5.1 `app/admin/tipos-credito/page.tsx`

**Lista principal:**
- Tabla con columnas: Nombre, Segmento BCE, Tasa %, # Subtipos, Estado (Badge), Acciones
- Badge verde "Activo" / gris "Inactivo"
- Botón "+" para crear nuevo tipo

**Dialog "Crear/Editar Tipo de Crédito":**
- Input Nombre
- Select "Segmento BCE" — opciones desde `SEGMENTOS_BCE_NOMBRES` (constante)
- Al seleccionar segmento: mostrar la tasa máxima legal: "Máximo permitido: X.XX%"
- Input "Tasa de interés anual" — validar que `tasa <= tasa_maxima_segmento`
  - Si supera: borde rojo + "La tasa no puede superar X.XX% (límite BCE)"
- Textarea Descripción
- Switch "Requiere RUC del solicitante"
- Switch "Activo"

**Subtipos (panel expandible por tipo):**
- Al hacer clic en una fila: expandir panel de subtipos
- Lista de subtipos con: Nombre, Monto Min-Max, Plazo Min-Max, Acciones
- Dialog para crear/editar subtipo:
  - Input Nombre
  - Inputs Monto Mín ($) y Monto Máx ($) — validar Min < Max
  - Inputs Plazo Mín (meses) y Plazo Máx (meses) — validar Min < Max
  - Textarea Descripción
  - Switch Activo

**Queries:**
```sql
-- Cargar
SELECT tipos_credito.*, subtipos_credito, cobros_indirectos
FROM tipos_credito
WHERE institucion_id = ?
ORDER BY nombre

-- Crear tipo
INSERT INTO tipos_credito (institucion_id, nombre, segmento_bce, tasa_interes_anual, ...)

-- Toggle activo
UPDATE tipos_credito SET activo = NOT activo WHERE id = ?
```

---

### 2.5.2 `app/admin/cobros-indirectos/page.tsx`

**Lista:**
- Tabla: Nombre, Tipo (%), Valor, Base cálculo, Aplica a, SOLCA, Obligatorio, Acciones
- Columna "Aplica a": "Todos los créditos" si `es_global`, o nombre del tipo específico

**Dialog "Crear/Editar Cobro Indirecto":**
- Input Nombre (ej: "SOLCA", "Seguro desgravamen", "Comisión de apertura")
- RadioGroup Tipo: "Porcentaje sobre monto" / "Valor fijo"
- Input Valor:
  - Si porcentaje: mostrar "%" al final, hint "Ej: 0.5 para 0.5%"
  - Si fijo: mostrar "$" al inicio
- RadioGroup Base de cálculo: "Sobre monto del crédito" / "Sobre valor del bien"
  - "Sobre valor del bien" aparece deshabilitado si no hay tipos de crédito que tengan valor_bien
- Select "Aplica a":
  - Opción "Todos los créditos (global)"
  - O lista de tipos de crédito
- Switch "Es SOLCA" (lógica especial de proporcionalidad)
- Switch "Obligatorio"
- **Preview de cálculo:** mostrar ejemplo con monto `$10,000` y `$500` de diferencia si porcentaje
  - "Para un crédito de $10,000 a 12 meses → SOLCA: $50 total / $4.17 por cuota"

**Alerta informativa sobre SOLCA:**
```
ℹ️ Si "Es SOLCA" está activo, el cálculo aplica la regla de proporcionalidad:
   Si plazo ≤ 12 meses: total = monto × 0.5% × (plazo/12)
   Si plazo > 12 meses: total = monto × 0.5%
```

---

### 2.5.3 `app/admin/requisitos-credito/page.tsx`

**Por tipo de crédito:**
- Select para filtrar por tipo de crédito
- Lista de requisitos del tipo seleccionado

**Por cada requisito:**
- Nombre, Tipo de archivo, Obligatorio (Badge), Acciones

**Dialog crear/editar:**
- Select "Tipo de crédito"
- Input Nombre del documento (ej: "Rol de pagos", "Escritura del bien")
- Textarea Descripción
- Select Tipo de archivo: Documento PDF / Imagen / Cédula / RUC
- Switch Obligatorio

**Nota:** cédula y RUC son automáticos (no se crean aquí, se manejan por `requiere_ruc` y siempre se pide cédula). Estos son documentos adicionales.

---

## Fase 2.6 — Admin: Dashboard y Solicitudes

### 2.6.1 `app/admin/dashboard/page.tsx`

**Cards de métricas (fetch al cargar):**
```sql
-- Solicitudes por estado
SELECT estado, COUNT(*) FROM solicitudes_credito
WHERE usuarios.institucion_id = ?
GROUP BY estado

-- Simulaciones del mes actual
SELECT COUNT(*) FROM simulaciones
WHERE created_at >= date_trunc('month', NOW())

-- Clientes registrados
SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente' AND institucion_id = ?
```

**Layout de métricas (4 cards):**
- Solicitudes pendientes → número con Badge naranja
- Solicitudes aprobadas este mes → número con Badge verde
- Total clientes → número
- Simulaciones este mes → número

**Tabla "Últimas solicitudes" (últimas 10):**
- Columnas: Cliente, Tipo crédito, Monto, Cuota, Estado, Fecha, Acciones
- Botón "Ver detalle" → navega a `/admin/solicitudes?id=...`
- Refresh automático cada 60 segundos (opcional, con `setInterval`)

---

### 2.6.2 `app/admin/solicitudes/page.tsx`

**Filtros y búsqueda:**
- Input de búsqueda por nombre/cédula del cliente
- Select "Estado": todos / pendiente / documentos / análisis / biometría / en revisión / aprobada / rechazada
- Select "Tipo de crédito"
- Rango de fechas (opcional)

**Tabla de solicitudes:**
- Columnas: # Solicitud, Cliente (nombre + cédula), Tipo, Monto, Cuota final, Estado, Fecha, Acciones
- Badge de estado con colores:
  - pendiente → gris
  - documentos → azul
  - analisis → amarillo
  - biometria → morado
  - en_revision → naranja
  - aprobada → verde
  - rechazada → rojo
- Botón "Ver" → abre Sheet lateral o navega a detalle

**Sheet/Dialog de detalle de solicitud:**
- Datos del cliente: nombre, cédula, teléfono, dirección
- Datos del crédito: tipo, monto, plazo, cuota, sistema
- Análisis financiero: ingresos, gastos, capacidad
- Documentos: links a descargar cédula, RUC, otros
- Validación biométrica: ✓ / ✗ + foto selfie si hay
- Tabla de amortización resumida

**Acciones del admin (solo si estado = 'en_revision'):**
- Botón "Aprobar" → Dialog de confirmación → `UPDATE estado = 'aprobada'`
- Botón "Rechazar" → Dialog con campo "Motivo de rechazo" → `UPDATE estado = 'rechazada', motivo_rechazo = ...`
- Textarea "Observaciones" → `UPDATE observaciones_admin = ...`

---

## Fase 2.7 — Simulador de Inversión + Solicitud

### 2.7.1 `app/cliente/simulador-inversion/page.tsx`

**Flujo:**
1. Select "Tipo de producto de inversión" — carga desde `productos_inversion WHERE activo = true`
2. Al seleccionar: mostrar descripción, rango de montos, plazo, tasa
3. Input Monto a invertir
4. Input Plazo (en días para plazo_fijo, en número de aportes para ahorro_programado)
5. Si `tipo = 'ahorro_objetivo'`: Input "Meta que deseas alcanzar"
6. Botón "Simular" → llamar función correspondiente de `lib/calculos/inversion.ts`

**Resultado según tipo:**

*Plazo Fijo:*
- Tabla simple: Monto invertido / Rendimiento estimado / Total a recibir / Fecha de vencimiento

*Ahorro Programado:*
- Tabla período a período: Período / Aporte / Interés ganado / Saldo acumulado
- Total aportes / Total intereses / Saldo final

*Ahorro Objetivo:*
- "Para alcanzar $X en N días, necesitas aportar $Y por período"
- Tabla de progreso hacia la meta

**Botón "Me interesa"** → `/cliente/solicitud-inversion?producto=id&monto=X&plazo=N`

---

### 2.7.2 `app/cliente/solicitud-inversion/page.tsx`

**Flujo simplificado (3 pasos):**

Paso 1 — Confirmar datos + condiciones:
- Pre-cargado desde query params de la simulación
- Mostrar resumen del producto e inversión

Paso 2 — Documentos:
- Solo cédula de identidad (siempre) → Supabase Storage `inversiones-docs/{solicitud_id}/cedula.jpg`

Paso 3 — Biometría + Confirmación:
- Mismo componente `ValidacionBiometrica.tsx` reutilizado
- Resumen y botón "Enviar solicitud"

---

## Fase 2.8 — Panel Cliente: Dashboard, Mis Solicitudes, Mis Simulaciones

### 2.8.1 `app/cliente/dashboard/page.tsx`

**Cards de resumen:**
- "Tu capacidad crediticia estimada" — si tiene análisis financiero reciente, calcular y mostrar
- "Simulaciones realizadas" — COUNT de simulaciones del usuario
- "Solicitudes activas" — solicitudes no rechazadas ni aprobadas

**Acciones rápidas (botones):**
- "Simular crédito" → `/cliente/simulador-credito`
- "Simular inversión" → `/cliente/simulador-inversion`
- "Ver mis solicitudes" → `/cliente/mis-solicitudes`

**Últimas simulaciones (3 cards):**
- Tipo de crédito, monto, cuota, fecha
- Botón "Ver tabla completa" (recuperar de tabla `simulaciones`)

---

### 2.8.2 `app/cliente/mis-solicitudes/page.tsx`

**Lista de solicitudes del usuario actual:**
```sql
SELECT solicitudes_credito.*, tipos_credito.nombre, subtipos_credito.nombre
FROM solicitudes_credito
WHERE usuario_id = auth.uid()
ORDER BY created_at DESC
```

**Por cada solicitud:**
- Card con: Tipo crédito, Monto, Cuota final, Estado (Badge), Fecha
- Timeline de progreso visual: los 5 pasos con ✓ o pendiente según el estado
- Si `estado = 'aprobada'`: Badge verde + mensaje de felicitación
- Si `estado = 'rechazada'`: Badge rojo + motivo de rechazo
- Si `estado = 'en_revision'`: "Tu solicitud está siendo revisada por el equipo"
- Botón "Continuar" si la solicitud está en progreso (estado != 'en_revision' ni terminado)
  - Lleva al paso correcto de `/cliente/solicitud-credito?solicitud=id&paso=N`

---

### 2.8.3 `app/cliente/mis-simulaciones/page.tsx`

**Lista de simulaciones del usuario:**
```sql
SELECT simulaciones.*, tipos_credito.nombre, subtipos_credito.nombre
FROM simulaciones
WHERE usuario_id = auth.uid()
ORDER BY created_at DESC
```

**Por cada simulación:**
- Card: Tipo, Subtipo, Sistema (francesa/alemana), Monto, Cuota final, Fecha
- Botón "Ver tabla" → expandir/modal con la tabla completa (del `tabla_json`)
- Botón "Descargar PDF" → `generarTablaPDF()` con los datos guardados
- Botón "Solicitar este crédito" → `/cliente/solicitud-credito?simulacion=id`

---

## Fase 2.9 — Admin: Tasas BCE, Productos Inversión, Reportes

### 2.9.1 `app/admin/tasas-referencia/page.tsx`

**Vista de solo lectura** (los admins no modifican tasas, vienen del BCE):
- Tabla con todas las tasas activas desde `tasas_referencia`
- Columnas: Segmento, Subsegmento, Tasa Referencial, Tasa Máxima, Vigencia, Resolución
- Badge "Vigente" / "Vencida" según `vigencia_hasta`
- Botón "Actualizar tasas" → Dialog informativo: "Las tasas se actualizan según resoluciones del BCE. Modifica los valores aquí si hay una nueva resolución."
  - Formulario inline para editar tasa_referencial y tasa_maxima
  - `UPDATE tasas_referencia SET ... WHERE id = ?`
- `<NotaLegal tipo="credito" />` al pie con el texto legal completo

---

### 2.9.2 `app/admin/productos-inversion/page.tsx`

**Lista de productos de inversión:**
- Tabla: Nombre, Tipo, Tasa %, Plazo (min-max días), Monto (min-max), Estado

**Dialog crear/editar:**
- Input Nombre
- Select Tipo: Plazo Fijo / Ahorro Programado / Ahorro Objetivo
- Input Tasa anual (%)
- Inputs Plazo mín y máx en días
- Inputs Monto mín y máx
- Select Frecuencia de aporte: único / mensual / trimestral / semestral / anual
- Input Objetivo (texto, ej: "Viaje", "Vehículo") — solo para ahorro_objetivo
- Textarea Descripción
- Switch Activo

---

### 2.9.3 `app/admin/reportes/page.tsx`

**Sección 1 — Estadísticas generales:**
- Gráfico de barras: solicitudes por mes (últimos 6 meses)
  - Usar `recharts` (instalar: `npm install recharts`)
  - Agrupadas por estado (aprobadas vs rechazadas)
- Gráfico de pastel: distribución por tipo de crédito
- Número de simulaciones por semana

**Sección 2 — Exportar datos:**
- Botón "Exportar solicitudes a CSV":
  - Genera CSV con todas las solicitudes + datos del cliente + estado
  - Descarga directo desde el browser (Blob)
- Botón "Exportar simulaciones a CSV"

**Queries para reportes:**
```sql
SELECT DATE_TRUNC('month', created_at) as mes, estado, COUNT(*)
FROM solicitudes_credito
WHERE usuarios.institucion_id = ?
AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY mes, estado
ORDER BY mes
```

---

## Fase 2.10 — Supabase Storage: Buckets y Políticas

### Buckets a crear (via MCP `execute_sql` o Dashboard)

```sql
-- Bucket para logos de instituciones (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Bucket para documentos de solicitudes de crédito (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('solicitudes-docs', 'solicitudes-docs', false);

-- Bucket para documentos de inversiones (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inversiones-docs', 'inversiones-docs', false);
```

### Políticas RLS para Storage

```sql
-- logos: cualquiera puede leer, solo admins pueden subir
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "logos_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- solicitudes-docs: solo el dueño puede subir/leer sus docs
CREATE POLICY "solicitudes_docs_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'solicitudes-docs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
    )
  );

-- inversiones-docs: igual que solicitudes
CREATE POLICY "inversiones_docs_owner" ON storage.objects
  FOR ALL USING (
    bucket_id = 'inversiones-docs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
    )
  );
```

### Helper de upload en `lib/supabase/storage.ts`

```typescript
// Funciones a crear:
uploadLogoInstitucion(file: File, institucionId: string): Promise<string>  // retorna URL pública
uploadDocumentoSolicitud(file: File, solicitudId: string, nombre: string): Promise<string>
getDocumentoUrl(bucket: string, path: string): Promise<string>  // URL temporal firmada
```

---

## Fase 2.11 — Pruebas de integración y ajustes finales

### Checklist de pruebas funcionales

**Auth:**
- [ ] Login con credenciales incorrectas → muestra error claro
- [ ] Login con credenciales correctas como admin → redirige a `/admin/dashboard`
- [ ] Login con credenciales correctas como cliente → redirige a `/cliente/dashboard`
- [ ] Registro de nuevo usuario → trigger crea fila en `usuarios`
- [ ] Usuario sin sesión intenta acceder a `/admin/*` → redirige a `/login`
- [ ] Admin intenta acceder a `/cliente/*` → puede acceder (tiene permisos superiores)

**Simulador de crédito:**
- [ ] Calcular amortización francesa $7,000 / 15% / 8 meses → cuota base ≈ $924.59
- [ ] Calcular amortización alemana mismos parámetros → primera cuota > $924.59, última < $924.59
- [ ] SOLCA con plazo ≤ 12 meses → aplica proporcionalidad
- [ ] SOLCA con plazo > 12 meses → monto × 0.5% completo
- [ ] Tabla con columnas dinámicas por cada cobro configurado
- [ ] Descarga de PDF genera archivo correcto con datos institucionales
- [ ] Simulación guardada en tabla `simulaciones` en Supabase

**Validaciones:**
- [ ] Cédula "1710034065" → válida
- [ ] Cédula "1234567890" → inválida
- [ ] RUC persona natural → módulo 10 correcto
- [ ] RUC sociedad → módulo 11 con coeficientes [4,3,2,7,6,5,4,3,2]
- [ ] Capacidad de pago $2,000 ingresos / $800 gastos / $200 otras cuotas / cuota nueva $500 → 75% > 40% → NO puede

**Admin CRUD:**
- [ ] Crear tipo de crédito con tasa > máximo BCE → error de validación
- [ ] Toggle activo/inactivo de tipo de crédito
- [ ] Crear cobro SOLCA y verificar que aparece en simulador
- [ ] Editar datos de institución → preview de colores en tiempo real

**Solicitud multi-paso:**
- [ ] Completar los 5 pasos → solicitud queda en estado `en_revision`
- [ ] Admin aprueba solicitud → estado `aprobada`, cliente ve el resultado
- [ ] Admin rechaza con motivo → cliente ve el motivo

**Inversión:**
- [ ] Simular plazo fijo → cálculo correcto de interés simple
- [ ] Simular ahorro programado → tabla período a período correcta

### Configuración de email en Supabase Auth

1. Ir a Supabase Dashboard → Authentication → Email Templates
2. Personalizar plantilla de confirmación con branding de SimulaFinance
3. Activar "Confirm email" en Authentication → Settings
4. Para producción: configurar SMTP propio (Resend, SendGrid, etc.)

### Configuración adicional de Supabase

```sql
-- Crear función para obtener institución del admin actual
CREATE OR REPLACE FUNCTION get_institucion_id()
RETURNS uuid AS $$
  SELECT institucion_id FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Orden de implementación recomendado

Para maximizar la velocidad y poder probar el sistema integrado lo antes posible:

```
1.  Fase 2.1  — Auth Login + Registro (desbloqueador: sin esto no se puede probar nada)
2.  Fase 2.10 — Buckets Storage (infraestructura necesaria para fases 2.3 y 2.7)
3.  Fase 2.4  — Admin Institución (config base para que el tema dinámico funcione)
4.  Fase 2.5  — Admin Tipos, Cobros, Requisitos (datos necesarios para el simulador)
5.  Fase 2.2  — Simulador de Crédito (módulo core, lo más valioso del sistema)
6.  Fase 2.6  — Admin Dashboard + Solicitudes
7.  Fase 2.3  — Solicitud de Crédito multi-paso (flujo completo con biometría)
8.  Fase 2.8  — Panel Cliente (Dashboard + Mis solicitudes + Mis simulaciones)
9.  Fase 2.7  — Simulador + Solicitud de Inversión
10. Fase 2.9  — Admin Tasas, Productos inversión, Reportes
11. Fase 2.11 — QA + ajustes finales
```

---

## Dependencias adicionales a instalar

```bash
# Reportes (gráficas)
npm install recharts

# Modelos face-api.js ya instalado, copiar weights:
# Copiar de node_modules/face-api.js/weights/ → public/models/
# Archivos necesarios:
# - ssd_mobilenetv1_model-weights_manifest.json + shards
# - face_landmark_68_model-weights_manifest.json + shards
# - face_recognition_model-weights_manifest.json + shards
```

---

## Notas de arquitectura para la implementación

- **Datos de institución:** Usar un Server Component en `app/admin/layout.tsx` para hacer fetch de la institución una sola vez y pasarla por contexto. No hacer múltiples fetches por página.
- **RLS activa:** Todas las queries desde el cliente usan automáticamente el usuario autenticado gracias al `createBrowserClient`. Las políticas RLS en Supabase filtran por `institucion_id` automáticamente en las tablas que lo requieren.
- **`generarTablaCompleta()`:** Esta función es completamente local (no llama a Supabase). Calcular siempre en el cliente, nunca en el servidor.
- **face-api.js:** Solo importar con `dynamic(() => import('face-api.js'), { ssr: false })` en Next.js para evitar errores de SSR.
- **Paginación de tabla:** Para créditos a largo plazo (ej: hipotecas a 240 meses), la tabla tiene 241 filas. Implementar paginación virtual o paginación real de 25 filas.
- **Toast global:** Ya configurado con Sonner. Usar `import { toast } from 'sonner'` desde cualquier componente.
