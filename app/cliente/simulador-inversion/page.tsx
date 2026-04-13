// ============================================================
// SimulaFinance — Cliente: Simulador de Inversión
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcularPlazoFijo } from '@/lib/calculos/inversion'
import {  NotaLegal } from '@/components/shared/NotaLegal'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Loader2,
  TrendingUp,
  Calculator,
  DollarSign,
  Calendar,
  Percent,
  ArrowRight,
} from 'lucide-react'

interface ProductoInversion {
  id: string
  nombre: string
  tasa_interes_anual: number
  plazo_min_dias: number
  plazo_max_dias: number
  monto_min: number
  monto_max: number
  descripcion: string | null
}

interface ResultadoInversion {
  monto_invertido: number
  rendimiento_estimado: number
  total_a_recibir: number
  fecha_vencimiento: string
  tasa_anual: number
  plazo_dias: number
}

export default function SimuladorInversionPage() {
  const [productos, setProductos] = useState<ProductoInversion[]>([])
  const [cargando, setCargando] = useState(true)

  // Selecciones
  const [productoId, setProductoId] = useState('')
  const [monto, setMonto] = useState(0)
  const [plazoDias, setPlazoDias] = useState(0)
  const [resultado, setResultado] = useState<ResultadoInversion | null>(null)
  const [calculando, setCalculando] = useState(false)

  // Constraints
  const producto = productos.find((p) => p.id === productoId)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('institucion_id')
        .eq('id', user.id)
        .single()

      if (!perfil?.institucion_id) { setCargando(false); return }

      const { data } = await supabase
        .from('productos_inversion')
        .select('*')
        .eq('institucion_id', perfil.institucion_id)
        .eq('activo', true)
        .order('nombre')

      setProductos((data as ProductoInversion[]) ?? [])
      setCargando(false)
    })()
  }, [])

  const handleProductoChange = (id: string) => {
    setProductoId(id)
    setResultado(null)
    const prod = productos.find((p) => p.id === id)
    if (prod) {
      setMonto(prod.monto_min)
      setPlazoDias(prod.plazo_min_dias)
    }
  }

  const montoValido = producto ? monto >= producto.monto_min && monto <= producto.monto_max : false
  const plazoValido = producto ? plazoDias >= producto.plazo_min_dias && plazoDias <= producto.plazo_max_dias : false
  const formValido = productoId && montoValido && plazoValido

  const handleCalcular = async () => {
    if (!producto || !formValido) return

    setCalculando(true)
    try {
      const res = calcularPlazoFijo(monto, producto.tasa_interes_anual, plazoDias)
      setResultado(res)

      // Guardar en Supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('simulaciones_inversion').insert({
          usuario_id: user.id,
          producto_inversion_id: productoId,
          monto: monto,
          plazo_dias: plazoDias,
          tasa_interes_anual: producto.tasa_interes_anual,
          rendimiento_estimado: res.rendimiento_estimado,
          total_a_recibir: res.total_a_recibir,
        })
      }

      toast.success('Simulación calculada')
    } catch {
      toast.error('Error al calcular')
    } finally {
      setCalculando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const fmt = (n: number) => `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Simulador de inversión</h1>
      <p className="text-gray-500 text-sm mb-8">
        Proyecta el rendimiento de tu inversión a plazo fijo.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-5 sticky top-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="size-4" />
              Parámetros
            </h2>

            {/* Producto */}
            <div className="space-y-1.5">
              <Label>Producto de inversión</Label>
              <Select value={productoId} onValueChange={(v) => handleProductoChange(v ?? '')}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.tasa_interes_anual}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {producto?.descripcion && (
                <p className="text-xs text-gray-400">{producto.descripcion}</p>
              )}
            </div>

            {productoId && producto && (
              <>
                {/* Monto */}
                <div className="space-y-1.5">
                  <Label>Monto a invertir ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <Input
                      type="number"
                      value={monto || ''}
                      onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                      className="h-10 pl-7"
                      min={producto.monto_min}
                      max={producto.monto_max}
                      aria-invalid={monto > 0 && !montoValido}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Entre ${producto.monto_min.toLocaleString()} y ${producto.monto_max.toLocaleString()}
                  </p>
                </div>

                {/* Plazo */}
                <div className="space-y-1.5">
                  <Label>Plazo (días)</Label>
                  <Input
                    type="number"
                    value={plazoDias || ''}
                    onChange={(e) => setPlazoDias(parseInt(e.target.value) || 0)}
                    className="h-10"
                    min={producto.plazo_min_dias}
                    max={producto.plazo_max_dias}
                    aria-invalid={plazoDias > 0 && !plazoValido}
                  />
                  <p className="text-xs text-gray-400">
                    Entre {producto.plazo_min_dias} y {producto.plazo_max_dias} días
                  </p>
                </div>

                {/* Tasa */}
                <div className="bg-gray-50 rounded-lg p-3 border text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tasa anual</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                      {producto.tasa_interes_anual}%
                    </span>
                  </div>
                </div>

                {/* Botón */}
                <Button
                  onClick={handleCalcular}
                  disabled={!formValido || calculando}
                  className="w-full h-10 text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--color-inst-primary)' }}
                >
                  {calculando ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
                  Calcular rendimiento
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-2">
          {resultado ? (
            <div className="space-y-6">
              {/* Cards de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-5 text-center">
                    <DollarSign className="size-6 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Monto invertido</p>
                    <p className="text-xl font-bold font-mono">{fmt(resultado.monto_invertido)}</p>
                  </CardContent>
                </Card>

                <Card className="border-2" style={{ borderColor: 'var(--color-inst-primary)' }}>
                  <CardContent className="p-5 text-center">
                    <TrendingUp className="size-6 mx-auto mb-2" style={{ color: 'var(--color-inst-primary)' }} />
                    <p className="text-sm text-gray-500 mb-1">Rendimiento</p>
                    <p className="text-xl font-bold font-mono" style={{ color: 'var(--color-inst-primary)' }}>
                      +{fmt(resultado.rendimiento_estimado)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5 text-center">
                    <DollarSign className="size-6 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Total a recibir</p>
                    <p className="text-xl font-bold font-mono text-green-600">{fmt(resultado.total_a_recibir)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detalle */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Detalle de la inversión</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 flex items-center gap-1"><Percent className="size-3" /> Tasa anual</p>
                    <p className="font-semibold font-mono mt-1">{resultado.tasa_anual}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 flex items-center gap-1"><Calendar className="size-3" /> Plazo</p>
                    <p className="font-semibold mt-1">{resultado.plazo_dias} días</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha vencimiento</p>
                    <p className="font-semibold mt-1">
                      {new Date(resultado.fecha_vencimiento).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Rendimiento diario</p>
                    <p className="font-semibold font-mono mt-1">
                      {fmt(resultado.rendimiento_estimado / resultado.plazo_dias)}/día
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-end">
                <Button
                  className="text-white cursor-pointer"
                  style={{ backgroundColor: 'var(--color-inst-primary)' }}
                  onClick={() => window.location.href = '/cliente/solicitud-inversion'}
                >
                  Me interesa
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <TrendingUp className="size-8 text-gray-300" />
              </div>
              <h3 className="text-gray-600 font-medium mb-1">Sin simulación</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Selecciona un producto, monto y plazo para proyectar tu rendimiento.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <NotaLegal tipo="credito" />
      </div>
    </div>
  )
}
