// ============================================================
// SimulaFinance — Paso 1: Formulario de Datos Personales
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { validarCedula } from '@/lib/validaciones/cedula-ecuatoriana'
import { validarRUC } from '@/lib/validaciones/ruc-ecuatoriano'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

interface DatosPersonales {
  nombre: string
  apellido: string
  cedula: string
  ruc?: string
  telefono: string
  direccion: string
}

interface PersonalDataFormProps {
  initialData?: Partial<DatosPersonales>
  requiereRUC?: boolean
  onNext: (data: DatosPersonales) => void
  loading?: boolean
}

export function FormularioDatosPersonales({
  initialData,
  requiereRUC = false,
  onNext,
  loading = false,
}: PersonalDataFormProps) {
  const [form, setForm] = useState<DatosPersonales>({
    nombre: initialData?.nombre || '',
    apellido: initialData?.apellido || '',
    cedula: initialData?.cedula || '',
    ruc: initialData?.ruc || '',
    telefono: initialData?.telefono || '',
    direccion: initialData?.direccion || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validating, setValidating] = useState<Record<string, boolean>>({})

  // Validación reactiva de cédula
  useEffect(() => {
    if (form.cedula.length === 10) {
      const res = validarCedula(form.cedula)
      setErrors((prev) => ({ ...prev, cedula: res.valido ? '' : res.mensaje }))
      setValidating((prev) => ({ ...prev, cedula: res.valido }))
    } else if (form.cedula.length > 0) {
      setErrors((prev) => ({ ...prev, cedula: 'La cédula debe tener 10 dígitos.' }))
      setValidating((prev) => ({ ...prev, cedula: false }))
    }
  }, [form.cedula])

  // Validación reactiva de RUC
  useEffect(() => {
    if (requiereRUC && form.ruc) {
      if (form.ruc.length === 13) {
        const res = validarRUC(form.ruc)
        setErrors((prev) => ({ ...prev, ruc: res.valido ? '' : res.mensaje }))
        setValidating((prev) => ({ ...prev, ruc: res.valido }))
      } else {
        setErrors((prev) => ({ ...prev, ruc: 'El RUC debe tener 13 dígitos.' }))
        setValidating((prev) => ({ ...prev, ruc: false }))
      }
    }
  }, [form.ruc, requiereRUC])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones finales
    const newErrors: Record<string, string> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'Nombre requerido.'
    if (!form.apellido.trim()) newErrors.apellido = 'Apellido requerido.'
    if (!validating.cedula) newErrors.cedula = errors.cedula || 'Cédula inválida.'
    if (requiereRUC && !validating.ruc) newErrors.ruc = errors.ruc || 'RUC inválido.'
    if (!form.telefono.trim() || form.telefono.length < 9) newErrors.telefono = 'Teléfono inválido.'
    if (!form.direccion.trim()) newErrors.direccion = 'Dirección requerida.'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onNext(form)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Juan"
            className={errors.nombre ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input
            id="apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            placeholder="Pérez"
            className={errors.apellido ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.apellido && <p className="text-xs text-red-500">{errors.apellido}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cedula">Cédula de Identidad *</Label>
          <div className="relative">
            <Input
              id="cedula"
              value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="0123456789"
              className={errors.cedula ? 'border-red-500 pr-10' : validating.cedula ? 'border-green-500 pr-10' : 'pr-10'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {validating.cedula && <Check className="size-4 text-green-500" />}
              {errors.cedula && <AlertCircle className="size-4 text-red-500" />}
            </div>
          </div>
          {errors.cedula && <p className="text-xs text-red-500">{errors.cedula}</p>}
        </div>

        {requiereRUC && (
          <div className="space-y-1.5">
            <Label htmlFor="ruc">RUC *</Label>
            <div className="relative">
              <Input
                id="ruc"
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                placeholder="0123456789001"
                className={errors.ruc ? 'border-red-500 pr-10' : validating.ruc ? 'border-green-500 pr-10' : 'pr-10'}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validating.ruc && <Check className="size-4 text-green-500" />}
                {errors.ruc && <AlertCircle className="size-4 text-red-500" />}
              </div>
            </div>
            {errors.ruc && <p className="text-xs text-red-500">{errors.ruc}</p>}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefono">Teléfono de contacto *</Label>
        <Input
          id="telefono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '').slice(0, 15) })}
          placeholder="09XXXXXXXX"
          className={errors.telefono ? 'border-red-500' : ''}
        />
        {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direccion">Dirección domiciliaria *</Label>
        <textarea
          id="direccion"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          placeholder="Calle Secundaria N12-34 y Av. Principal"
          className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.direccion ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {errors.direccion && <p className="text-xs text-red-500">{errors.direccion}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="text-white cursor-pointer"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Siguiente paso
        </Button>
      </div>
    </form>
  )
}
