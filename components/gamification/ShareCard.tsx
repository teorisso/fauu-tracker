'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { MateriaEstado, Logro } from '@/lib/types'
import { MATERIAS, HORAS_TOTALES_OBLIGATORIAS } from '@/lib/data/materias'
import { Download, Check, X, Eye, Share2 } from 'lucide-react'

export type HitoTipo =
  | { tipo: 'materia'; materiaId: string; nombre: string; nota?: number }
  | { tipo: 'logro'; logro: Logro }

interface ShareHitoProps {
  hito: HitoTipo
  nombre: string
  estados: Record<string, MateriaEstado>
  onClose: () => void
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// Colores de la paleta existente
const COLORS = {
  bgDark: '#1e3a5f',        // azul oscuro de la paleta
  bgMedium: '#264b73',
  accent: '#2d6a4f',         // verde aprobadas
  accentLight: '#d4edda',
  textWhite: '#f8f9fa',
  textMuted: '#a0b4c8',
  border: '#3a5f85',
  yellow: '#f5c842',
}

export function ShareHito({ hito, nombre, estados, onClose }: ShareHitoProps) {
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [showFullPreview, setShowFullPreview] = useState(false)
  const blobRef = useRef<Blob | null>(null)

  const aprobadas = Object.values(estados).filter(
    (e) => e.estado === 'final_aprobado' || e.estado === 'promocionada'
  ).length
  const totalMaterias = MATERIAS.length
  const pct = Math.round((aprobadas / totalMaterias) * 100)
  const horas = MATERIAS.reduce((acc, m) => {
    const e = estados[m.id]
    return e && (e.estado === 'final_aprobado' || e.estado === 'promocionada')
      ? acc + m.horasCatedra
      : acc
  }, 0)

  const tituloHito = hito.tipo === 'materia'
    ? `¡Aprobé ${hito.nombre}!`
    : `¡Desbloqueé: ${hito.logro.nombre}!`

  const emojiHito = hito.tipo === 'materia' ? '✅' : hito.logro.emoji

  const subtituloHito = hito.tipo === 'materia'
    ? (hito.nota ? `Nota: ${hito.nota}` : 'Materia aprobada')
    : hito.logro.descripcion

  const generateImage = useCallback((): HTMLCanvasElement | null => {
    const W = 1080
    const H = 1080
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Fondo sólido — azul oscuro de la paleta
    ctx.fillStyle = COLORS.bgDark
    ctx.fillRect(0, 0, W, H)

    // Patrón de puntos sutil
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    for (let i = 0; i < W; i += 30) {
      for (let j = 0; j < H; j += 30) {
        ctx.beginPath()
        ctx.arc(i, j, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Línea superior — verde de la paleta
    ctx.fillStyle = COLORS.accent
    ctx.fillRect(0, 0, W, 5)

    // Subtítulo app
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '20px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FAUU Tracker · Arquitectura Plan 2018', W / 2, 60)

    // Nombre del estudiante
    ctx.fillStyle = COLORS.textWhite
    ctx.font = '28px Inter, system-ui, sans-serif'
    ctx.fillText(nombre || 'Estudiante', W / 2, 100)

    // Separador
    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(200, 130)
    ctx.lineTo(W - 200, 130)
    ctx.stroke()

    // === HITO PRINCIPAL ===

    // Emoji grande
    ctx.font = '120px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emojiHito, W / 2, 280)
    ctx.textBaseline = 'alphabetic'

    // Título del hito
    ctx.fillStyle = COLORS.textWhite
    ctx.font = 'bold 52px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Wrap text if too long
    const maxWidth = W - 160
    const words = tituloHito.split(' ')
    const lines: string[] = []
    let currentLine = ''
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = test
      }
    }
    lines.push(currentLine)

    const lineHeight = 62
    const startY = 400
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, startY + i * lineHeight)
    }

    // Subtítulo del hito
    const subY = startY + lines.length * lineHeight + 20
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '26px Inter, system-ui, sans-serif'
    ctx.fillText(subtituloHito, W / 2, subY)

    // === STATS COMPACTOS ===
    const statsY = 650
    const statsData = [
      `${aprobadas}/${totalMaterias} materias`,
      `${horas}/${HORAS_TOTALES_OBLIGATORIAS} horas`,
      `${pct}% completado`,
    ]

    // Stats box
    const boxW = W - 200
    const boxH = 80
    const boxX = 100
    drawRoundRect(ctx, boxX, statsY, boxW, boxH, 12)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fill()
    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '22px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(statsData.join('  ·  '), W / 2, statsY + 47)

    // Barra de progreso
    const barY = statsY + boxH + 30
    const barX = 100
    const barW = W - 200
    const barH = 10

    drawRoundRect(ctx, barX, barY, barW, barH, 5)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()

    const filledW = (pct / 100) * barW
    if (filledW > 0) {
      drawRoundRect(ctx, barX, barY, filledW, barH, 5)
      ctx.fillStyle = COLORS.accent
      ctx.fill()
    }

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '16px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Progreso de carrera', barX, barY + 30)
    ctx.textAlign = 'right'
    ctx.fillText(`${pct}%`, barX + barW, barY + 30)

    // Barra por año
    const yearBarY = barY + 60
    ctx.font = '16px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'

    for (let anio = 1; anio <= 6; anio++) {
      const materiasAnio = MATERIAS.filter((m) => m.anio === anio)
      const aprobadasAnio = materiasAnio.filter((m) => {
        const e = estados[m.id]
        return e && (e.estado === 'final_aprobado' || e.estado === 'promocionada')
      }).length
      const segW = barW / 6
      const segX = barX + (anio - 1) * segW

      ctx.fillStyle = COLORS.textMuted
      ctx.fillText(`${anio}°`, segX + segW / 2, yearBarY - 6)

      drawRoundRect(ctx, segX + 3, yearBarY, segW - 6, 8, 3)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fill()

      if (aprobadasAnio > 0) {
        const filled = (aprobadasAnio / materiasAnio.length) * (segW - 6)
        drawRoundRect(ctx, segX + 3, yearBarY, filled, 8, 3)
        ctx.fillStyle = aprobadasAnio === materiasAnio.length ? COLORS.accent : COLORS.bgMedium
        ctx.fill()
      }
    }

    // Footer
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '18px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('fauu-tracker.vercel.app', W / 2, H - 40)

    // Línea inferior
    ctx.fillStyle = COLORS.accent
    ctx.fillRect(0, H - 5, W, 5)

    return canvas
  }, [nombre, emojiHito, tituloHito, subtituloHito, aprobadas, totalMaterias, horas, pct, estados])

  // Generar imagen al montar el componente
  useEffect(() => {
    const canvas = generateImage()
    if (!canvas) return

    // Guardar data URL para preview
    setImageDataUrl(canvas.toDataURL('image/png'))

    // Guardar blob para descarga
    canvas.toBlob((b) => {
      blobRef.current = b
    }, 'image/png')
  }, [generateImage])

  // Guardar imagen localmente
  const handleDownload = useCallback(async () => {
    setSaving(true)
    try {
      const blob = blobRef.current
      if (!blob) {
        const canvas = generateImage()
        if (!canvas) return
        const newBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png')
        )
        if (!newBlob) return
        blobRef.current = newBlob
      }

      const fileBlob = blobRef.current!

      // Usar File System Access API — abre diálogo nativo "Guardar como..."
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as unknown as { showSaveFilePicker: (opts: Record<string, unknown>) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
            suggestedName: 'fauu-tracker-hito.png',
            types: [{
              description: 'Imagen PNG',
              accept: { 'image/png': ['.png'] },
            }],
          })
          const writable = await handle.createWritable()
          await writable.write(fileBlob)
          await writable.close()
          setDone(true)
          setTimeout(() => setDone(false), 3000)
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }

      // Fallback: mostrar la imagen grande para guardar con clic derecho
      setShowFullPreview(true)
    } catch (err) {
      console.error('Error guardando imagen:', err)
    } finally {
      setSaving(false)
    }
  }, [generateImage])

  // Compartir nativo a redes sociales (WhatsApp, Instagram, Twitter, etc.)
  const handleShare = useCallback(async () => {
    setSaving(true)
    try {
      const blob = blobRef.current
      if (!blob) return

      const file = new File([blob], 'fauu-tracker-hito.png', { type: 'image/png' })

      // Verificar soporte al momento de clickear
      if (typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: tituloHito,
          text: `${tituloHito} 🏗️ #FAUUTracker`,
          files: [file],
        })
        setDone(true)
        setTimeout(() => setDone(false), 3000)
      } else {
        // Navegador no soporta compartir archivos — fallback a descarga
        handleDownload()
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error compartiendo:', err)
      }
    } finally {
      setSaving(false)
    }
  }, [tituloHito, handleDownload])

  // Vista de preview grande para clic derecho → Guardar imagen como...
  if (showFullPreview && imageDataUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
        <div className="relative w-full max-w-lg space-y-3">
          <div className="rounded-lg border bg-background p-3 text-center space-y-1">
            <p className="text-sm font-semibold">Clic derecho en la imagen → &quot;Guardar imagen como...&quot;</p>
            <p className="text-xs text-muted-foreground">
              Esto te permite elegir nombre y ubicación del archivo
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt={tituloHito}
            className="w-full rounded-lg shadow-2xl"
          />
          <button
            onClick={() => setShowFullPreview(false)}
            className="w-full rounded-md border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            ← Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg border bg-background p-5 shadow-lg space-y-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1">
          <h3 className="text-base font-semibold">Compartir hito</h3>
          <p className="text-xs text-muted-foreground">
            Descargá la imagen para compartir en redes sociales
          </p>
        </div>

        {/* Preview de la imagen real generada */}
        {imageDataUrl ? (
          <div className="overflow-hidden rounded-lg border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={tituloHito}
              className="w-full"
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-[hsl(var(--estado-final-aprobado-bg))] p-4 text-[hsl(var(--estado-final-aprobado-fg))]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{emojiHito}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{tituloHito}</p>
                <p className="text-xs opacity-80">{subtituloHito}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs opacity-70">
              <span>{aprobadas}/{totalMaterias} materias · {pct}%</span>
              <span>FAUU Tracker</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Fila principal: Compartir + Guardar */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border bg-[hsl(var(--estado-final-aprobado-bg))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--estado-final-aprobado-fg))] transition-colors hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                  Compartiendo...
                </>
              ) : done ? (
                <>
                  <Check className="h-4 w-4" />
                  ¡Listo!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Compartir
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Guardar
            </button>
          </div>
          {/* Fila secundaria: Ver + Cerrar */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFullPreview(true)}
              disabled={!imageDataUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver imagen completa
            </button>
            <button
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-xs transition-colors hover:bg-muted"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
