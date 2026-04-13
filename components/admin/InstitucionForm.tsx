// ============================================================
// SimulaFinance — Admin: Formulario de Configuración de Institución
// ============================================================
// Formulario completo con 3 secciones:
//   1. Identidad: nombre, logo (upload), slogan, RUC
//   2. Colores: primario, secundario, acento con preview en tiempo real
//   3. Contacto: dirección, ciudad, teléfono, email, sitio web
// ============================================================
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadLogoInstitucion } from '@/lib/supabase/storage'
import { validarRUC } from '@/lib/validaciones/ruc-ecuatoriano'
import { generateCSSVars } from '@/lib/theme/dynamic-colors'
import type { Institucion, ColoresInstitucion } from '@/types'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import {
  Loader2,
  Save,
  Upload,
  Building2,
  Palette,
  Phone,
  Globe,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface InstitucionFormProps {
  institucionInicial: Institucion | null
  adminUsuarioId: string
}

export function InstitucionForm({ institucionInicial, adminUsuarioId }: InstitucionFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [institucion, setInstitucion] = useState<Institucion | null>(institucionInicial)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Campos del formulario
  const [nombre, setNombre] = useState(institucionInicial?.nombre ?? '')
  const [slogan, setSlogan] = useState(institucionInicial?.slogan ?? '')
  const [logoUrl, setLogoUrl] = useState(institucionInicial?.logo_url ?? '')
  const [ruc, setRuc] = useState(institucionInicial?.ruc_institucion ?? '')
  const [rucError, setRucError] = useState('')

  // Colores
  const [colorPrimario, setColorPrimario] = useState(institucionInicial?.color_primario ?? '#1a1a2e')
  const [colorSecundario, setColorSecundario] = useState(institucionInicial?.color_secundario ?? '#16213e')
  const [colorAcento, setColorAcento] = useState(institucionInicial?.color_acento ?? '#0f3460')

  // Contacto
  const [direccion, setDireccion] = useState(institucionInicial?.direccion ?? '')
  const [ciudad, setCiudad] = useState(institucionInicial?.ciudad ?? '')
  const [telefono, setTelefono] = useState(institucionInicial?.telefono ?? '')
  const [email, setEmail] = useState(institucionInicial?.email ?? '')
  const [sitioWeb, setSitioWeb] = useState(institucionInicial?.sitio_web ?? '')

  // Preview en tiempo real de colores
  useEffect(() => {
    const colores: ColoresInstitucion = {
      primario: colorPrimario,
      secundario: colorSecundario,
      acento: colorAcento,
    }
    const vars = generateCSSVars(colores)
    Object.entries(vars).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val)
    })
  }, [colorPrimario, colorSecundario, colorAcento])

  // Validación de RUC
  const handleRucChange = (val: string) => {
    setRuc(val)
    if (val.length === 13) {
      const resultado = validarRUC(val)
      setRucError(resultado.valido ? '' : resultado.mensaje)
    } else if (val.length > 0) {
      setRucError('El RUC debe tener 13 dígitos.')
    } else {
      setRucError('')
    }
  }

  // Subir logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen.')
      return
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo no debe superar 2MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const instId = institucion?.id ?? 'new'
      const url = await uploadLogoInstitucion(file, instId)
      setLogoUrl(url)
      toast.success('Logo subido correctamente.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  // Guardar cambios
  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre de la institución es requerido.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const datos = {
        nombre: nombre.trim(),
        slogan: slogan.trim() || null,
        logo_url: logoUrl || null,
        ruc_institucion: ruc.trim() || null,
        color_primario: colorPrimario,
        color_secundario: colorSecundario,
        color_acento: colorAcento,
        direccion: direccion.trim() || null,
        ciudad: ciudad.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        sitio_web: sitioWeb.trim() || null,
      }

      if (institucion?.id) {
        // UPDATE existente
        const { error } = await supabase
          .from('instituciones')
          .update(datos)
          .eq('id', institucion.id)

        if (error) throw error
        toast.success('Institución actualizada correctamente.')
      } else {
        // INSERT nueva
        const { data, error } = await supabase
          .from('instituciones')
          .insert(datos)
          .select()
          .single()

        if (error) throw error

        setInstitucion(data)

        // Asociar al admin
        await supabase
          .from('usuarios')
          .update({ institucion_id: data.id })
          .eq('id', adminUsuarioId)

        toast.success('Institución creada correctamente.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sección 1 — Identidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-gray-500" />
            <div>
              <CardTitle>Identidad</CardTitle>
              <CardDescription>Nombre, logo y slogan de la institución</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 shadow-sm"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-md"
                  style={{ backgroundColor: colorPrimario }}
                >
                  {nombre ? nombre.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploadingLogo ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <Upload className="size-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Logo de la institución</p>
              <p className="text-xs text-gray-400">JPG, PNG o SVG. Máximo 2MB.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? <Loader2 className="size-3 animate-spin mr-1" /> : <Upload className="size-3 mr-1" />}
                Subir logo
              </Button>
            </div>
          </div>

          <Separator />

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="inst-nombre">Nombre de la institución *</Label>
            <Input
              id="inst-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Cooperativa de Ahorro y Crédito..."
              className="h-10"
              required
            />
          </div>

          {/* Slogan */}
          <div className="space-y-1.5">
            <Label htmlFor="inst-slogan">Slogan</Label>
            <Input
              id="inst-slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Tu confianza, nuestro compromiso"
              className="h-10"
            />
          </div>

          {/* RUC */}
          <div className="space-y-1.5">
            <Label htmlFor="inst-ruc">RUC de la institución</Label>
            <div className="relative">
              <Input
                id="inst-ruc"
                value={ruc}
                onChange={(e) => handleRucChange(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="1790016919001"
                maxLength={13}
                className="h-10 pr-8"
                aria-invalid={!!rucError}
              />
              {ruc.length === 13 && !rucError && (
                <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-green-500" />
              )}
              {rucError && (
                <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-red-500" />
              )}
            </div>
            {rucError && <p className="text-xs text-destructive">{rucError}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Sección 2 — Colores */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-gray-500" />
            <div>
              <CardTitle>Colores del tema</CardTitle>
              <CardDescription>Personaliza la paleta de colores. Los cambios se previsualizan en tiempo real.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color primario */}
            <ColorPicker
              label="Color primario"
              value={colorPrimario}
              onChange={setColorPrimario}
            />
            {/* Color secundario */}
            <ColorPicker
              label="Color secundario"
              value={colorSecundario}
              onChange={setColorSecundario}
            />
            {/* Color acento */}
            <ColorPicker
              label="Color acento"
              value={colorAcento}
              onChange={setColorAcento}
            />
          </div>

          <Separator />

          {/* Preview del tema */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Vista previa del tema</p>
            <div className="rounded-lg border overflow-hidden">
              {/* Mini Navbar */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: colorSecundario }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    {nombre ? nombre.charAt(0) : 'S'}
                  </div>
                  <span className="text-white text-sm font-medium">
                    {nombre || 'SimulaFinance'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-white/60 text-xs">Inicio</span>
                  <span className="text-white/60 text-xs">Simulador</span>
                  <span className="text-white/60 text-xs">Inversiones</span>
                </div>
              </div>

              {/* Mini Content */}
              <div className="p-4 bg-gray-50 space-y-3">
                <div className="flex gap-2">
                  <div
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-medium cursor-default"
                    style={{ backgroundColor: colorPrimario }}
                  >
                    Botón primario
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-white text-xs font-medium cursor-default"
                    style={{ backgroundColor: colorAcento }}
                  >
                    Botón acento
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border cursor-default"
                    style={{ borderColor: colorPrimario, color: colorPrimario }}
                  >
                    Botón outline
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium" style={{ color: colorPrimario }}>Enlace primario</span>
                  <span className="font-medium" style={{ color: colorAcento }}>Enlace acento</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección 3 — Contacto */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="size-5 text-gray-500" />
            <div>
              <CardTitle>Información de contacto</CardTitle>
              <CardDescription>Datos de contacto públicos de la institución</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="inst-direccion">
                <MapPin className="size-3.5 inline mr-1" />
                Dirección
              </Label>
              <Input
                id="inst-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. Amazonas N34-123"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-ciudad">Ciudad</Label>
              <Input
                id="inst-ciudad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Quito"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-telefono">
                <Phone className="size-3.5 inline mr-1" />
                Teléfono
              </Label>
              <Input
                id="inst-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="02-123-4567"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-email">
                <Mail className="size-3.5 inline mr-1" />
                Correo electrónico
              </Label>
              <Input
                id="inst-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@institucion.com"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="inst-web">
                <Globe className="size-3.5 inline mr-1" />
                Sitio web
              </Label>
              <Input
                id="inst-web"
                type="url"
                value={sitioWeb}
                onChange={(e) => setSitioWeb(e.target.value)}
                placeholder="https://www.institucion.com"
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading || !nombre.trim()}
          className="h-10 px-6 text-white cursor-pointer"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Color Picker sub-component ──────────────────────────────
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          placeholder="#1a1a2e"
          className="h-10 font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
      {/* Variantes */}
      <div className="flex gap-1 mt-1">
        <div
          className="w-6 h-6 rounded border border-gray-200"
          style={{ backgroundColor: value }}
          title="Base"
        />
        <div
          className="w-6 h-6 rounded border border-gray-200"
          style={{ backgroundColor: value, opacity: 0.7 }}
          title="Light"
        />
        <div
          className="w-6 h-6 rounded border border-gray-200"
          style={{ backgroundColor: value, filter: 'brightness(0.8)' }}
          title="Dark"
        />
      </div>
    </div>
  )
}
