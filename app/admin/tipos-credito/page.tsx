// ============================================================
// SimulaFinance — Admin: Tipos de Crédito (CRUD completo)
// ============================================================
// Lista, crea, edita tipos de crédito y sus subtipos.
// Valida tasa vs. tasa máxima BCE del segmento seleccionado.
// ============================================================
'use client'
import React from 'react'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TASAS_BCE, SEGMENTOS_BCE_NOMBRES, getTasaMaxima } from '@/lib/constants/tasas-bce'
import type { TipoCredito, SubtipoCredito } from '@/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Save,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CategoriaCredito } from '@/types'

const CATEGORIAS_CREDITO: { value: CategoriaCredito; label: string }[] = [
  { value: 'hipotecario', label: 'Hipotecario / Vivienda' },
  { value: 'vehicular', label: 'Vehicular' },
  { value: 'consumo', label: 'Consumo' },
  { value: 'microcredito', label: 'Microcrédito' },
  { value: 'educativo', label: 'Educativo' },
  { value: 'otro', label: 'Otro' },
]

const SEGUROS_POR_CATEGORIA: Record<CategoriaCredito, string> = {
  hipotecario: 'Seguro de desgravamen + Seguro de incendios y terremotos (obligatorios por ley para créditos hipotecarios)',
  vehicular:   'Seguro de desgravamen + Seguro del vehículo (obligatorios para créditos vehiculares)',
  consumo:     'Seguro de desgravamen (obligatorio para créditos de consumo)',
  microcredito:'Seguro de desgravamen (obligatorio para microcréditos)',
  educativo:   'Seguro de desgravamen (recomendado)',
  otro:        'Verifica con el área de seguros los cobros aplicables.',
}

interface TipoCreditoConSubtipos extends TipoCredito {
  subtipos_credito?: SubtipoCredito[]
}

// ─── Formulario vacío ────────────────────────────────────────
const tipoVacio = {
  nombre: '',
  segmento_bce: '',
  tasa_interes_anual: 0,
  categoria: 'consumo' as CategoriaCredito,
  descripcion: '',
  requiere_ruc: false,
  activo: true,
}

const subtipoVacio = {
  nombre: '',
  monto_min: 0,
  monto_max: 0,
  plazo_min_meses: 0,
  plazo_max_meses: 0,
  descripcion: '',
  activo: true,
}

export default function TiposCreditoPage() {
  const [tipos, setTipos] = useState<TipoCreditoConSubtipos[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [institucionId, setInstitucionId] = useState<string>('')

  // Dialog tipo
  const [dialogTipo, setDialogTipo] = useState(false)
  const [editandoTipo, setEditandoTipo] = useState<TipoCredito | null>(null)
  const [formTipo, setFormTipo] = useState(tipoVacio)
  const [tasaMaximaSegmento, setTasaMaximaSegmento] = useState<number | null>(null)
  const [guardandoTipo, setGuardandoTipo] = useState(false)

  // Dialog subtipo
  const [dialogSubtipo, setDialogSubtipo] = useState(false)
  const [subtipoParent, setSubtipoParent] = useState<string>('')
  const [editandoSubtipo, setEditandoSubtipo] = useState<SubtipoCredito | null>(null)
  const [formSubtipo, setFormSubtipo] = useState(subtipoVacio)
  const [guardandoSubtipo, setGuardandoSubtipo] = useState(false)

  // ─── Cargar datos ────────────────────────────────────────────
  const cargarTipos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('institucion_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.institucion_id) {
      setLoading(false)
      return
    }

    setInstitucionId(perfil.institucion_id)

    const { data } = await supabase
      .from('tipos_credito')
      .select('*, subtipos_credito(*)')
      .eq('institucion_id', perfil.institucion_id)
      .order('nombre')

    setTipos((data as TipoCreditoConSubtipos[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarTipos() }, [cargarTipos])

  // ─── Segmento BCE seleccionado → actualizar tasa máxima ──
  useEffect(() => {
    if (formTipo.segmento_bce) {
      // El segmento puede ser "Microcrédito — Minorista" o "Consumo Ordinario"
      const parts = formTipo.segmento_bce.split(' — ')
      const maxima = getTasaMaxima(parts[0], parts[1])
      setTasaMaximaSegmento(maxima)
    } else {
      setTasaMaximaSegmento(null)
    }
  }, [formTipo.segmento_bce])

  // ─── Handlers Tipo ───────────────────────────────────────────
  const abrirCrearTipo = () => {
    setEditandoTipo(null)
    setFormTipo(tipoVacio)
    setDialogTipo(true)
  }

  const abrirEditarTipo = (tipo: TipoCredito) => {
    setEditandoTipo(tipo)
    setFormTipo({
      nombre: tipo.nombre,
      segmento_bce: tipo.segmento_bce,
      tasa_interes_anual: tipo.tasa_interes_anual,
      categoria: tipo.categoria ?? 'consumo',
      descripcion: tipo.descripcion ?? '',
      requiere_ruc: tipo.requiere_ruc,
      activo: tipo.activo,
    })
    setDialogTipo(true)
  }

  const guardarTipo = async () => {
    if (!formTipo.nombre.trim()) {
      toast.error('El nombre es requerido.')
      return
    }
    if (!formTipo.segmento_bce) {
      toast.error('Selecciona un segmento BCE.')
      return
    }
    if (tasaMaximaSegmento && formTipo.tasa_interes_anual > tasaMaximaSegmento) {
      toast.error(`La tasa no puede superar ${tasaMaximaSegmento}% (límite BCE).`)
      return
    }

    setGuardandoTipo(true)
    const supabase = createClient()

    const datos = {
      institucion_id: institucionId,
      nombre: formTipo.nombre.trim(),
      segmento_bce: formTipo.segmento_bce,
      tasa_interes_anual: formTipo.tasa_interes_anual,
      categoria: formTipo.categoria,
      descripcion: formTipo.descripcion.trim() || null,
      requiere_ruc: formTipo.requiere_ruc,
      activo: formTipo.activo,
    }

    try {
      if (editandoTipo) {
        const { error } = await supabase
          .from('tipos_credito')
          .update(datos)
          .eq('id', editandoTipo.id)
        if (error) throw error
        toast.success('Tipo de crédito actualizado.')
      } else {
        const { error } = await supabase
          .from('tipos_credito')
          .insert(datos)
        if (error) throw error
        toast.success('Tipo de crédito creado.')
      }

      setDialogTipo(false)
      cargarTipos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setGuardandoTipo(false)
    }
  }

  const toggleActivoTipo = async (tipo: TipoCredito) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('tipos_credito')
      .update({ activo: !tipo.activo })
      .eq('id', tipo.id)

    if (error) {
      toast.error('Error al cambiar estado.')
    } else {
      toast.success(tipo.activo ? 'Tipo desactivado.' : 'Tipo activado.')
      cargarTipos()
    }
  }

  // ─── Handlers Subtipo ────────────────────────────────────────
  const abrirCrearSubtipo = (tipoCreditoId: string) => {
    setSubtipoParent(tipoCreditoId)
    setEditandoSubtipo(null)
    setFormSubtipo(subtipoVacio)
    setDialogSubtipo(true)
  }

  const abrirEditarSubtipo = (subtipo: SubtipoCredito) => {
    setSubtipoParent(subtipo.tipo_credito_id)
    setEditandoSubtipo(subtipo)
    setFormSubtipo({
      nombre: subtipo.nombre,
      monto_min: subtipo.monto_min,
      monto_max: subtipo.monto_max,
      plazo_min_meses: subtipo.plazo_min_meses,
      plazo_max_meses: subtipo.plazo_max_meses,
      descripcion: subtipo.descripcion ?? '',
      activo: subtipo.activo,
    })
    setDialogSubtipo(true)
  }

  const guardarSubtipo = async () => {
    if (!formSubtipo.nombre.trim()) { toast.error('Nombre requerido.'); return }
    if (formSubtipo.monto_min >= formSubtipo.monto_max) { toast.error('Monto mín debe ser menor que máx.'); return }
    if (formSubtipo.plazo_min_meses >= formSubtipo.plazo_max_meses) { toast.error('Plazo mín debe ser menor que máx.'); return }

    setGuardandoSubtipo(true)
    const supabase = createClient()

    const datos = {
      tipo_credito_id: subtipoParent,
      nombre: formSubtipo.nombre.trim(),
      monto_min: formSubtipo.monto_min,
      monto_max: formSubtipo.monto_max,
      plazo_min_meses: formSubtipo.plazo_min_meses,
      plazo_max_meses: formSubtipo.plazo_max_meses,
      descripcion: formSubtipo.descripcion.trim() || null,
      activo: formSubtipo.activo,
    }

    try {
      if (editandoSubtipo) {
        const { error } = await supabase.from('subtipos_credito').update(datos).eq('id', editandoSubtipo.id)
        if (error) throw error
        toast.success('Subtipo actualizado.')
      } else {
        const { error } = await supabase.from('subtipos_credito').insert(datos)
        if (error) throw error
        toast.success('Subtipo creado.')
      }
      setDialogSubtipo(false)
      cargarTipos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setGuardandoSubtipo(false)
    }
  }

  // ─── UI ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de crédito</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configura los productos de crédito disponibles para tus clientes.
          </p>
        </div>
        <Button
          onClick={abrirCrearTipo}
          className="text-white cursor-pointer"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          <Plus className="size-4" />
          Nuevo tipo
        </Button>
      </div>

      {tipos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400 text-sm">No hay tipos de crédito configurados aún.</p>
          <Button onClick={abrirCrearTipo} variant="outline" className="mt-4 cursor-pointer">
            <Plus className="size-4" />
            Crear primer tipo
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Segmento BCE</TableHead>
                <TableHead className="text-right">Tasa %</TableHead>
                <TableHead className="text-center">Subtipos</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.map((tipo) => {
                const isExpanded = expandido === tipo.id
                const subtipos = tipo.subtipos_credito ?? []
                return (
                  <React.Fragment key={tipo.id}>
                    <TableRow className="cursor-pointer hover:bg-gray-50/80" onClick={() => setExpandido(isExpanded ? null : tipo.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="size-4 text-gray-400" /> : <ChevronRight className="size-4 text-gray-400" />}
                      </TableCell>
                      <TableCell className="font-medium">{tipo.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {CATEGORIAS_CREDITO.find(c => c.value === tipo.categoria)?.label ?? tipo.categoria ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{tipo.segmento_bce}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{tipo.tasa_interes_anual}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{subtipos.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={tipo.activo ? 'default' : 'secondary'}>
                          {tipo.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-xs" onClick={() => abrirEditarTipo(tipo)} title="Editar">
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => toggleActivoTipo(tipo)} title={tipo.activo ? 'Desactivar' : 'Activar'}>
                            {tipo.activo ? <ToggleRight className="size-3.5 text-green-600" /> : <ToggleLeft className="size-3.5 text-gray-400" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Panel expandido: subtipos */}
                    {isExpanded && (
                      <TableRow key={`${tipo.id}-sub`}>
                        <TableCell colSpan={8} className="bg-gray-50/50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-700">Subtipos de «{tipo.nombre}»</p>
                            <Button variant="outline" size="sm" onClick={() => abrirCrearSubtipo(tipo.id)} className="cursor-pointer">
                              <Plus className="size-3" />
                              Agregar subtipo
                            </Button>
                          </div>
                          {subtipos.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">Sin subtipos configurados.</p>
                          ) : (
                            <div className="rounded-lg border bg-white overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Monto mín – máx</TableHead>
                                    <TableHead>Plazo mín – máx</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {subtipos.map((sub) => (
                                    <TableRow key={sub.id}>
                                      <TableCell className="font-medium text-sm">{sub.nombre}</TableCell>
                                      <TableCell className="text-sm font-mono">
                                        ${sub.monto_min.toLocaleString()} – ${sub.monto_max.toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {sub.plazo_min_meses} – {sub.plazo_max_meses} meses
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant={sub.activo ? 'default' : 'secondary'}>
                                          {sub.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="ghost" size="icon-xs" onClick={() => abrirEditarSubtipo(sub)}>
                                          <Pencil className="size-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── Dialog tipo de crédito ─────────────────────────────── */}
      <Dialog open={dialogTipo} onOpenChange={setDialogTipo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editandoTipo ? 'Editar tipo de crédito' : 'Nuevo tipo de crédito'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={formTipo.nombre}
                onChange={(e) => setFormTipo({ ...formTipo, nombre: e.target.value })}
                placeholder="Crédito de consumo"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <Select
                value={formTipo.categoria}
                onValueChange={(v) => setFormTipo({ ...formTipo, categoria: v as CategoriaCredito })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_CREDITO.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formTipo.categoria && (
                <Alert className="mt-1 py-2 bg-blue-50 border-blue-200">
                  <Info className="size-3.5 text-blue-500" />
                  <AlertDescription className="text-xs text-blue-700 ml-1">
                    <strong>Seguros recomendados:</strong> {SEGUROS_POR_CATEGORIA[formTipo.categoria]}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Segmento BCE *</Label>
              <Select
                value={formTipo.segmento_bce}
                onValueChange={(v) => setFormTipo({ ...formTipo, segmento_bce: v ?? '' })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar segmento" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTOS_BCE_NOMBRES.map((seg) => (
                    <SelectItem key={seg} value={seg}>
                      {seg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tasaMaximaSegmento && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Máximo permitido: {tasaMaximaSegmento}%
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tasa de interés anual (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formTipo.tasa_interes_anual}
                onChange={(e) => setFormTipo({ ...formTipo, tasa_interes_anual: parseFloat(e.target.value) || 0 })}
                className="h-10"
                aria-invalid={!!tasaMaximaSegmento && formTipo.tasa_interes_anual > tasaMaximaSegmento}
              />
              {tasaMaximaSegmento && formTipo.tasa_interes_anual > tasaMaximaSegmento && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  La tasa no puede superar {tasaMaximaSegmento}% (límite BCE)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                value={formTipo.descripcion}
                onChange={(e) => setFormTipo({ ...formTipo, descripcion: e.target.value })}
                placeholder="Descripción del tipo de crédito..."
                className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formTipo.requiere_ruc}
                  onChange={(e) => setFormTipo({ ...formTipo, requiere_ruc: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Requiere RUC del solicitante</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formTipo.activo}
                  onChange={(e) => setFormTipo({ ...formTipo, activo: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Activo</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={guardarTipo}
              disabled={guardandoTipo}
              className="text-white cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              {guardandoTipo ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editandoTipo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog subtipo ─────────────────────────────────────── */}
      <Dialog open={dialogSubtipo} onOpenChange={setDialogSubtipo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoSubtipo ? 'Editar subtipo' : 'Nuevo subtipo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={formSubtipo.nombre}
                onChange={(e) => setFormSubtipo({ ...formSubtipo, nombre: e.target.value })}
                placeholder="Ej: Automóvil nuevo"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto mínimo ($)</Label>
                <Input
                  type="number"
                  value={formSubtipo.monto_min}
                  onChange={(e) => setFormSubtipo({ ...formSubtipo, monto_min: parseFloat(e.target.value) || 0 })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monto máximo ($)</Label>
                <Input
                  type="number"
                  value={formSubtipo.monto_max}
                  onChange={(e) => setFormSubtipo({ ...formSubtipo, monto_max: parseFloat(e.target.value) || 0 })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plazo mínimo (meses)</Label>
                <Input
                  type="number"
                  value={formSubtipo.plazo_min_meses}
                  onChange={(e) => setFormSubtipo({ ...formSubtipo, plazo_min_meses: parseInt(e.target.value) || 0 })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Plazo máximo (meses)</Label>
                <Input
                  type="number"
                  value={formSubtipo.plazo_max_meses}
                  onChange={(e) => setFormSubtipo({ ...formSubtipo, plazo_max_meses: parseInt(e.target.value) || 0 })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                value={formSubtipo.descripcion}
                onChange={(e) => setFormSubtipo({ ...formSubtipo, descripcion: e.target.value })}
                placeholder="Descripción del subtipo..."
                className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formSubtipo.activo}
                onChange={(e) => setFormSubtipo({ ...formSubtipo, activo: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Activo</span>
            </label>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={guardarSubtipo}
              disabled={guardandoSubtipo}
              className="text-white cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              {guardandoSubtipo ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editandoSubtipo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
