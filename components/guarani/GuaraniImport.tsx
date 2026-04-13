'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { parsearArchivoGuarani, GuaraniMateria } from '@/lib/logic/guaraniParser'
import { createClient } from '@/lib/supabase/client'
import { MateriaEstado, Estado } from '@/lib/types'
import { ESTADO_LABELS } from '@/lib/estado-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

const ESTADO_PRIORIDAD: Record<Estado, number> = {
  sin_cursar: 0,
  cursando: 1,
  regular_vencida: 2,
  regular_vigente: 3,
  promocionada: 4,
  final_aprobado: 5,
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

interface GuaraniImportProps {
  userId: string
  estadosActuales: Record<string, MateriaEstado>
}

function formatFechaCorta(iso?: string): string {
  if (!iso) return '-'
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

export function GuaraniImport({ userId, estadosActuales }: GuaraniImportProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [parsed, setParsed] = useState<GuaraniMateria[]>([])
  const [importMode, setImportMode] = useState<'replace' | 'onlyNew'>('replace')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setStep('upload')
    setParsed([])
    setImportMode('replace')
    setProgress({ current: 0, total: 0 })
    setImportedCount(0)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const buffer = await file.arrayBuffer()
      const extension = file.name.split('.').pop()?.toLowerCase()
      const fileType = extension === 'pdf' ? 'pdf' : 'xls'
      const result = await parsearArchivoGuarani(buffer, fileType)
      if (result.length === 0) {
        setError('No se encontraron materias en el archivo. Asegurate de subir el archivo .xls o .pdf de Historia Académica del SIU Guaraní.')
        return
      }
      setParsed(result)
      setStep('preview')
    } catch {
      setError('Error al leer el archivo. Verificá que sea un archivo .xls o .pdf válido de Historia Académica del SIU Guaraní.')
    }
  }

  function getMateriasToImport(): GuaraniMateria[] {
    return parsed.filter((m) => {
      if (!m.materiaId) return false
      if (m.estadoDetectado === 'sin_cursar') return false
      if (importMode === 'onlyNew') {
        const actual = estadosActuales[m.materiaId]
        return !actual || actual.estado === 'sin_cursar'
      }
      return true
    })
  }

  function isBetter(detected: Estado, current: Estado | undefined): boolean {
    return ESTADO_PRIORIDAD[detected] > ESTADO_PRIORIDAD[current ?? 'sin_cursar']
  }

  async function handleImport() {
    const toImport = getMateriasToImport()
    setStep('importing')
    setProgress({ current: 0, total: toImport.length })

    const supabase = createClient()
    let count = 0

    for (const m of toImport) {
      if (!m.materiaId) continue
      try {
        await supabase.from('materia_estados').upsert(
          {
            user_id: userId,
            materia_id: m.materiaId,
            estado: m.estadoDetectado,
            anio_cursado: m.anio_cursado ?? null,
            cuatrimestre: m.cuatrimestre ?? null,
            nota: m.nota ?? null,
            intentos_previos: m.intentos_previos,
            fecha_regularidad: m.fecha_regularidad ?? null,
            fecha_aprobacion: m.fecha_aprobacion ?? null,
          },
          { onConflict: 'user_id,materia_id' }
        )
        count++
      } catch (err) {
        console.error(`Error importando ${m.materiaId}:`, err)
      }
      setProgress((p) => ({ ...p, current: p.current + 1 }))
    }

    setImportedCount(count)
    setStep('done')
  }

  const recognized = parsed.filter((m) => m.materiaId && m.estadoDetectado !== 'sin_cursar')
  const unrecognized = parsed.filter((m) => !m.materiaId)
  const toImportCount = getMateriasToImport().length

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => { reset(); setOpen(true) }}>
        <FileSpreadsheet className="h-4 w-4" />
        Importar desde Guaraní
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar historial de Guaraní</DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">
                  Seleccioná el archivo .xls o .pdf de tu Historia Académica
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  SIU Guaraní → Reportes → Historia Académica → Exportar → Excel (.xls) o PDF
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xls,.xlsx,.pdf,application/pdf"
                  title="Seleccioná el archivo XLS o PDF de Historia Académica"
                  aria-label="Archivo XLS o PDF de Historia Académica"
                  className="mt-4 mx-auto block text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <p className="font-medium">¿Por qué Historia Académica y no Plan de Estudios?</p>
                <p className="mt-1">La Historia Académica incluye las fechas exactas de cada examen, necesarias para calcular los vencimientos de regularidad.</p>
              </div>
              {error && (
                <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                Se encontraron <strong>{recognized.length}</strong> materias reconocidas.
                Se actualizarán <strong>{toImportCount}</strong> estados.
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={importMode === 'replace' ? 'default' : 'outline'}
                  onClick={() => setImportMode('replace')}
                >
                  Reemplazar todo
                </Button>
                <Button
                  size="sm"
                  variant={importMode === 'onlyNew' ? 'default' : 'outline'}
                  onClick={() => setImportMode('onlyNew')}
                >
                  Solo materias sin estado
                </Button>
              </div>

              {/* Recognized materias table */}
              <div className="max-h-60 overflow-y-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Materia</th>
                      <th className="px-2 py-1.5 text-left font-medium">Estado</th>
                      <th className="px-2 py-1.5 text-right font-medium">Nota</th>
                      <th className="px-2 py-1.5 text-right font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recognized.map((m) => {
                      const current = m.materiaId ? estadosActuales[m.materiaId] : undefined
                      const better = isBetter(m.estadoDetectado, current?.estado)
                      const fechaDisplay = m.fecha_aprobacion
                        ? formatFechaCorta(m.fecha_aprobacion)
                        : m.fecha_regularidad
                          ? formatFechaCorta(m.fecha_regularidad)
                          : '-'
                      return (
                        <tr
                          key={m.codigoGuarani}
                          className={better ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'text-muted-foreground'}
                        >
                          <td className="px-2 py-1 truncate max-w-[180px]" title={m.nombreGuarani}>
                            {m.nombreGuarani}
                          </td>
                          <td className="px-2 py-1">{ESTADO_LABELS[m.estadoDetectado]}</td>
                          <td className="px-2 py-1 text-right">{m.nota ?? '-'}</td>
                          <td className="px-2 py-1 text-right whitespace-nowrap">{fechaDisplay}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {unrecognized.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">
                    {unrecognized.length} materia(s) no reconocida(s) (optativas)
                  </summary>
                  <ul className="mt-1 space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {unrecognized.map((m) => (
                      <li key={m.codigoGuarani}>
                        {m.nombreGuarani} ({m.codigoGuarani})
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="space-y-1 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
                <p className="font-medium">Vencimientos de regularidad</p>
                <p>Después de importar, vas a poder cargar las fechas de vencimiento de regularidad desde tu historial en el SIU. Esto activa las alertas automáticas.</p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => { reset(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={toImportCount === 0}>
                  Importar {toImportCount} materia(s)
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-4 py-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm font-medium">
                Importando... {progress.current}/{progress.total}
              </p>
              <Progress
                value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                className="h-2"
              />
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 py-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="font-medium">Import completado</p>
              <p className="text-sm text-muted-foreground">
                {importedCount} materia(s) actualizadas.
              </p>
              <p className="text-xs text-muted-foreground">
                Ahora podés cargar las fechas de vencimiento de regularidad desde la sección de abajo.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    reset()
                  }}
                >
                  Cargar vencimientos
                </Button>
                <Button
                  onClick={() => {
                    setOpen(false)
                    router.push('/')
                    router.refresh()
                  }}
                >
                  Ir al dashboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
