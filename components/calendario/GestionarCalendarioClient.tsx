'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MATERIAS } from '@/lib/data/materias'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, RefreshCw, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2, Download } from 'lucide-react'
import type { CalendarioFAUData } from '@/app/api/calendario-fau/[year]/route'
import type { MesasFAUData } from '@/app/api/mesas-fau/route'

interface MesaCustomRow {
  id: string
  user_id: string
  anio: number
  materia_id: string
  nombre_oficial: string
  dia_semana: string
  hora: string
  aula: string | null
  turno_numero: number
  fecha_inicio: string
  fecha_fin: string
}

interface GestionarCalendarioClientProps {
  userId: string
  mesasCustomInit: MesaCustomRow[]
}

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function GestionarCalendarioClient({
  userId,
  mesasCustomInit,
}: GestionarCalendarioClientProps) {
  const [mesasCustom, setMesasCustom] = useState<MesaCustomRow[]>(mesasCustomInit)
  const [selectedYear, setSelectedYear] = useState(2027)
  const [scraperStatus, setScraperStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [scraperData, setScraperData] = useState<CalendarioFAUData | null>(null)
  const [scraperError, setScraperError] = useState<string | null>(null)

  // Mesas FAU sync state
  const [mesasSyncStatus, setMesasSyncStatus] = useState<'idle' | 'loading' | 'preview' | 'importing' | 'ok' | 'error'>('idle')
  const [mesasSyncData, setMesasSyncData] = useState<MesasFAUData | null>(null)
  const [mesasSyncError, setMesasSyncError] = useState<string | null>(null)
  const [mesasSyncCount, setMesasSyncCount] = useState(0)

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    materiaId: '',
    diaSemana: 'lunes',
    hora: '08:00',
    aula: '',
    turnoNumero: '1',
    fechaInicio: '',
    fechaFin: '',
  })

  const mesasDelAno = mesasCustom.filter((m) => m.anio === selectedYear)

  async function obtenerMesasFAU() {
    setMesasSyncStatus('loading')
    setMesasSyncError(null)
    setMesasSyncData(null)
    try {
      const res = await fetch('/api/mesas-fau')
      const json = await res.json()
      if (!res.ok) {
        setMesasSyncError(json.error ?? 'Error al obtener mesas de la FAU')
        setMesasSyncStatus('error')
      } else {
        setMesasSyncData(json as MesasFAUData)
        setMesasSyncStatus('preview')
      }
    } catch {
      setMesasSyncError('No se pudo conectar. Verificá tu conexión a internet.')
      setMesasSyncStatus('error')
    }
  }

  async function importarMesasFAU() {
    if (!mesasSyncData || mesasSyncData.anio !== selectedYear || selectedYear < 2027) return

    setMesasSyncStatus('importing')
    const supabase = createClient()

    const rows: object[] = []
    for (const mesa of mesasSyncData.mesas) {
      if (!mesa.materiaId) continue
      const materia = MATERIAS.find((m) => m.id === mesa.materiaId)
      for (const turno of mesasSyncData.turnos) {
        rows.push({
          user_id: userId,
          anio: mesasSyncData.anio,
          materia_id: mesa.materiaId,
          nombre_oficial: materia?.nombre ?? mesa.nombreOficial,
          dia_semana: mesa.diaSemana,
          hora: mesa.hora,
          aula: mesa.aula ?? null,
          turno_numero: turno.numero,
          fecha_inicio: turno.fechaInicio,
          fecha_fin: turno.fechaFin,
        })
      }
    }

    const { error } = await supabase
      .from('mesas_custom')
      .upsert(rows, { onConflict: 'user_id,anio,materia_id,turno_numero' })

    if (error) {
      setMesasSyncError(`Error al importar: ${error.message}`)
      setMesasSyncStatus('error')
      return
    }

    // Refresh local list
    const { data: fresh } = await supabase
      .from('mesas_custom')
      .select('*')
      .eq('user_id', userId)
      .eq('anio', selectedYear)

    if (fresh) {
      setMesasSyncCount(rows.length)
      setMesasCustom((prev) => [
        ...prev.filter((m) => m.anio !== selectedYear),
        ...(fresh as MesaCustomRow[]),
      ])
    }

    setMesasSyncStatus('ok')
  }

  async function sincronizarFAU() {
    setScraperStatus('loading')
    setScraperError(null)
    setScraperData(null)
    try {
      const res = await fetch(`/api/calendario-fau/${selectedYear}`)
      const json = await res.json()
      if (!res.ok) {
        setScraperError(json.error ?? 'Error al obtener datos de la FAU')
        setScraperStatus('error')
      } else {
        setScraperData(json as CalendarioFAUData)
        setScraperStatus('ok')
      }
    } catch {
      setScraperError('No se pudo conectar. Verificá tu conexión a internet.')
      setScraperStatus('error')
    }
  }

  async function guardarMesa() {
    if (!formData.materiaId || !formData.fechaInicio || !formData.fechaFin) return
    const materia = MATERIAS.find((m) => m.id === formData.materiaId)
    if (!materia) return

    setFormLoading(true)
    const supabase = createClient()
    const row = {
      user_id: userId,
      anio: selectedYear,
      materia_id: formData.materiaId,
      nombre_oficial: materia.nombre,
      dia_semana: formData.diaSemana,
      hora: formData.hora,
      aula: formData.aula || null,
      turno_numero: parseInt(formData.turnoNumero),
      fecha_inicio: formData.fechaInicio,
      fecha_fin: formData.fechaFin,
    }

    const { data, error } = await supabase
      .from('mesas_custom')
      .upsert(row, { onConflict: 'user_id,anio,materia_id,turno_numero' })
      .select()
      .single()

    if (!error && data) {
      setMesasCustom((prev) => {
        const filtered = prev.filter(
          (m) => !(m.anio === selectedYear && m.materia_id === formData.materiaId && m.turno_numero === parseInt(formData.turnoNumero))
        )
        return [...filtered, data as MesaCustomRow]
      })
      setFormOpen(false)
      setFormData({ materiaId: '', diaSemana: 'lunes', hora: '08:00', aula: '', turnoNumero: '1', fechaInicio: '', fechaFin: '' })
    }
    setFormLoading(false)
  }

  async function eliminarMesa(id: string) {
    const supabase = createClient()
    await supabase.from('mesas_custom').delete().eq('id', id)
    setMesasCustom((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4 text-sm">
        <p className="font-medium text-blue-800 dark:text-blue-300">¿Cómo funciona?</p>
        <ol className="mt-2 space-y-1 text-blue-700 dark:text-blue-400 list-decimal list-inside">
          <li>
            Seleccioná el año que querés configurar.
          </li>
          <li>
            Hacé clic en <strong>Sincronizar calendario FAU</strong> para ver si ya publicaron el
            calendario en{' '}
            <a
              href="https://www.arq.unne.edu.ar/calendario-academico/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              arq.unne.edu.ar/calendario-academico
              <ExternalLink className="inline ml-1 h-3 w-3" />
            </a>
          </li>
          <li>
            Si el calendario no está publicado, podés cargar manualmente las mesas del{' '}
            <strong>Anexo III</strong> del PDF oficial.
          </li>
        </ol>
      </div>

      {/* Year selector + sync button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="year-select" className="text-sm">Año:</Label>
          <Select value={String(selectedYear)} onValueChange={(v: string) => {
            setSelectedYear(parseInt(v))
            setScraperStatus('idle')
            setScraperData(null)
            setScraperError(null)
            setMesasSyncStatus('idle')
            setMesasSyncData(null)
            setMesasSyncError(null)
          }}>
            <SelectTrigger id="year-select" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
              <SelectItem value="2029">2029</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={sincronizarFAU}
          disabled={scraperStatus === 'loading'}
          variant="outline"
          className="gap-2"
        >
          {scraperStatus === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sincronizar calendario FAU
        </Button>

        <a
          href="https://www.arq.unne.edu.ar/calendario-academico/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Ver calendario oficial <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Scraper result */}
      {scraperStatus === 'ok' && scraperData && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 p-4 text-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-semibold">Calendario {scraperData.anio} encontrado en el sitio de la FAU</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/30 p-2">
              <p className="font-semibold">{scraperData.mesas.length}</p>
              <p className="text-emerald-600 dark:text-emerald-500">Turnos de mesas</p>
            </div>
            <div className="rounded border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/30 p-2">
              <p className="font-semibold">{scraperData.feriados.length}</p>
              <p className="text-emerald-600 dark:text-emerald-500">Feriados</p>
            </div>
            <div className="rounded border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/30 p-2">
              <p className="font-semibold">{scraperData.inscripciones.length}</p>
              <p className="text-emerald-600 dark:text-emerald-500">Períodos inscripción</p>
            </div>
            <div className="rounded border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/30 p-2">
              <p className="font-semibold">{scraperData.especiales.length}</p>
              <p className="text-emerald-600 dark:text-emerald-500">Fechas especiales</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">Períodos de mesas:</p>
            {scraperData.mesas.map((m, i) => (
              <p key={i} className="text-xs text-emerald-600 dark:text-emerald-500">
                {m.text}: {formatDate(m.start)} – {formatDate(m.end)}
              </p>
            ))}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            Los feriados y períodos de mesas ya están disponibles en el calendario de la app.
            Todavía necesitás cargar manualmente el <strong>calendario de mesas por materia</strong> (día, hora, aula) del Anexo III del PDF.
          </p>
        </div>
      )}

      {scraperStatus === 'error' && scraperError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/20 p-4 text-sm">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">No se pudo obtener el calendario de la FAU</span>
          </div>
          <p className="mt-1 text-rose-600 dark:text-rose-500">{scraperError}</p>
          <p className="mt-2 text-xs text-rose-500">
            Podés consultar el{' '}
            <a
              href="https://www.arq.unne.edu.ar/calendario-academico/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              sitio oficial de la FAU
            </a>{' '}
            para ver si ya publicaron el calendario {selectedYear}.
          </p>
        </div>
      )}

      {/* Sincronizar mesas desde FAU (Anexo III) */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium text-sm">Mesas por materia (Anexo III)</p>
            <p className="text-xs text-muted-foreground">
              Importá el cronograma de mesas de{' '}
              <a
                href="https://www.arq.unne.edu.ar/turno-examenes/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                arq.unne.edu.ar/turno-examenes
                <ExternalLink className="inline ml-1 h-3 w-3" />
              </a>
            </p>
          </div>
          <Button
            onClick={obtenerMesasFAU}
            disabled={mesasSyncStatus === 'loading' || mesasSyncStatus === 'importing'}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {mesasSyncStatus === 'loading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Obtener mesas desde FAU
          </Button>
        </div>

        {/* Preview de datos scrapeados */}
        {(mesasSyncStatus === 'preview' || mesasSyncStatus === 'importing') && mesasSyncData && (
          <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Datos encontrados: {mesasSyncData.anio} — {mesasSyncData.mesas.filter((m) => m.materiaId).length} materias × {mesasSyncData.turnos.length} turnos
            </div>
            {mesasSyncData.anio !== selectedYear ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ La FAU publicó datos para <strong>{mesasSyncData.anio}</strong>, pero tenés seleccionado <strong>{selectedYear}</strong>.
                Solo podés importar cuando el año coincida.
              </p>
            ) : selectedYear < 2027 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ La importación manual solo está disponible para años 2027 en adelante.
                Para 2026 los datos se usan automáticamente en el calendario.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex-1">
                  Se van a crear o actualizar registros en tu calendario de {selectedYear}.
                </p>
                <Button
                  size="sm"
                  onClick={importarMesasFAU}
                  disabled={mesasSyncStatus === 'importing'}
                  className="shrink-0"
                >
                  {mesasSyncStatus === 'importing' ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Importando…</>
                  ) : (
                    'Importar mesas'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {mesasSyncStatus === 'ok' && (
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            {mesasSyncCount} registros importados correctamente para {selectedYear}.
          </div>
        )}

        {mesasSyncStatus === 'error' && mesasSyncError && (
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {mesasSyncError}
          </div>
        )}
      </div>

      {/* Mesas cargadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Mesas cargadas para {selectedYear}
            {mesasDelAno.length > 0 && (
              <Badge variant="outline" className="ml-2">{mesasDelAno.length}</Badge>
            )}
          </h2>
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Agregar mesa
          </Button>
        </div>

        {mesasDelAno.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            No tenés mesas cargadas para {selectedYear}.
            <br />
            Agegalá manualmente o sincronizá con el calendario de la FAU.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Materia</th>
                  <th className="px-3 py-2 text-left">Turno</th>
                  <th className="px-3 py-2 text-left">Período</th>
                  <th className="px-3 py-2 text-left">Día</th>
                  <th className="px-3 py-2 text-left">Hora</th>
                  <th className="px-3 py-2 text-left">Aula</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {mesasDelAno
                  .sort((a, b) => a.turno_numero - b.turno_numero || a.materia_id.localeCompare(b.materia_id))
                  .map((m) => {
                    const materia = MATERIAS.find((mat) => mat.id === m.materia_id)
                    return (
                      <tr key={m.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{materia?.nombre ?? m.nombre_oficial}</td>
                        <td className="px-3 py-2 text-muted-foreground">{m.turno_numero}°</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">
                          {formatDate(m.fecha_inicio)}–{formatDate(m.fecha_fin)}
                        </td>
                        <td className="px-3 py-2 capitalize text-muted-foreground">{m.dia_semana}</td>
                        <td className="px-3 py-2 text-muted-foreground">{m.hora}</td>
                        <td className="px-3 py-2 text-muted-foreground">{m.aula ?? '—'}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => eliminarMesa(m.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form */}
      {formOpen && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Nueva mesa — {selectedYear}</h3>
            <button
              onClick={() => setFormOpen(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Materia</Label>
              <Select value={formData.materiaId} onValueChange={(v: string) => setFormData((p) => ({ ...p, materiaId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una materia..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {MATERIAS.filter((m) => !m.esTFC && !m.esPPA).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Turno N°</Label>
              <Select value={formData.turnoNumero} onValueChange={(v: string) => setFormData((p) => ({ ...p, turnoNumero: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}°</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Día de la semana</Label>
              <Select value={formData.diaSemana} onValueChange={(v: string) => setFormData((p) => ({ ...p, diaSemana: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hora-input">Hora</Label>
              <Input
                id="hora-input"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData((p) => ({ ...p, hora: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="aula-input">Aula (opcional)</Label>
              <Input
                id="aula-input"
                placeholder="Ej: A 12"
                value={formData.aula}
                onChange={(e) => setFormData((p) => ({ ...p, aula: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="fecha-inicio">Fecha inicio del turno</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData((p) => ({ ...p, fechaInicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="fecha-fin">Fecha fin del turno</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData((p) => ({ ...p, fechaFin: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={guardarMesa} disabled={formLoading || !formData.materiaId || !formData.fechaInicio || !formData.fechaFin}>
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
