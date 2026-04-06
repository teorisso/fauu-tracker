'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { MateriaEstado, Logro } from '@/lib/types'
import { MATERIAS, HORAS_TOTALES_OBLIGATORIAS } from '@/lib/data/materias'
import { Download, Check, X, Share2 } from 'lucide-react'

export type HitoTipo =
  | { tipo: 'materia'; materiaId: string; nombre: string; nota?: number }
  | { tipo: 'logro'; logro: Logro }

interface ShareHitoProps {
  hito: HitoTipo
  nombre: string
  estados: Record<string, MateriaEstado>
  onClose: () => void
}

// ---------- helpers de canvas ----------

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

/**
 * Wrap text dentro de un ancho máximo. Devuelve las líneas resultantes.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth) {
      if (current) lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

// ---------- paleta ----------

const C = {
  bgTop:      '#152d4e',   // azul muy oscuro (top del gradiente)
  bgBottom:   '#1e3a5f',   // azul oscuro paleta (bottom del gradiente)
  accent:     '#2d6a4f',   // verde aprobadas
  accentGlow: 'rgba(45,106,79,0.25)',
  yellow:     '#f5c842',
  yellowGlow: 'rgba(245,200,66,0.20)',
  textWhite:  '#f0f4f8',
  textMuted:  '#8baabb',
  border:     'rgba(255,255,255,0.10)',
  glassPanel: 'rgba(255,255,255,0.05)',
  glassBorder:'rgba(255,255,255,0.12)',
}

// ---------- generador de canvas 1080×1920 ----------

function buildCanvas(
  tituloHito: string,
  subtituloHito: string,
  emojiHito: string,
  esLogro: boolean,
  nombre: string,
  aprobadas: number,
  totalMaterias: number,
  horas: number,
  pct: number,
  estados: Record<string, MateriaEstado>
): HTMLCanvasElement | null {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // ── Fondo degradado vertical ────────────────────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0,   C.bgTop)
  grad.addColorStop(0.6, C.bgBottom)
  grad.addColorStop(1,   '#172840')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Patrón de puntos sutil (solo en las esquinas)
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let i = 0; i < W; i += 40) {
    for (let j = 0; j < H; j += 40) {
      ctx.beginPath()
      ctx.arc(i, j, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── Banda superior (acento) ──────────────────────────────────────────────────
  const accentColor = esLogro ? C.yellow : C.accent
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, W, 6)

  // ── HEADER (y: 6 → 320) ─────────────────────────────────────────────────────
  // Logo / branding
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = '700 28px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // "FAUU TRACKER" badge
  const badgeW = 280, badgeH = 52, badgeX = (W - badgeW) / 2, badgeY = 55
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 26)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  ctx.strokeStyle = C.glassBorder
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = C.textWhite
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('FAUU Tracker · Plan 2018', W / 2, badgeY + badgeH / 2)

  // Nombre del estudiante
  ctx.fillStyle = C.textMuted
  ctx.font = '400 28px Inter, system-ui, sans-serif'
  ctx.fillText(nombre || 'Estudiante', W / 2, 150)

  // Separador
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(120, 210)
  ctx.lineTo(W - 120, 210)
  ctx.stroke()

  // ── HERO ZONE (y: 250 → 1000) ──────────────────────────────────────────────
  const heroY = 500 // centro del emoji

  // Glow radial detrás del emoji
  const glowColor = esLogro ? C.yellowGlow : C.accentGlow
  const glow = ctx.createRadialGradient(W / 2, heroY, 0, W / 2, heroY, 320)
  glow.addColorStop(0, glowColor)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, heroY - 320, W, 640)

  // Emoji grande
  ctx.font = '160px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = C.textWhite
  ctx.fillText(emojiHito, W / 2, heroY)

  // Badge de tipo (solo para logros) — debajo del emoji con margen amplio
  if (esLogro) {
    const lbW = 280, lbH = 48, lbX = (W - lbW) / 2, lbY = heroY + 110
    drawRoundRect(ctx, lbX, lbY, lbW, lbH, 24)
    ctx.fillStyle = C.yellow
    ctx.fill()
    ctx.fillStyle = '#1a1a1a'
    ctx.font = '700 19px Inter, system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText('LOGRO DESBLOQUEADO', W / 2, lbY + lbH / 2)
  }

  // Título del hito (wrapping)
  // Para logros: badge bottom = heroY+110+48 = heroY+158
  // titY baseline en heroY+300 → top de ascendentes ~heroY+230 > heroY+158 ✔
  const titY = esLogro ? heroY + 300 : heroY + 200
  ctx.fillStyle = C.textWhite
  const fontSize = tituloHito.length > 22 ? 62 : 68
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'center'
  const lines = wrapText(ctx, tituloHito, W - 140)
  const lineH = fontSize + 16
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, titY + i * lineH)
  }

  // Subtítulo / nota
  const subY = titY + lines.length * lineH + 28
  ctx.fillStyle = esLogro ? C.yellow : C.textMuted
  ctx.font = `${esLogro ? '500' : '400'} 32px Inter, system-ui, sans-serif`
  ctx.fillText(subtituloHito, W / 2, subY)

  // ── STATS ZONE (y: ~1050 → 1700) ────────────────────────────────────────────
  const statsTop = 1070

  // Panel glassmorphism
  const panelX = 70, panelW = W - 140
  const panelH = 560
  drawRoundRect(ctx, panelX, statsTop, panelW, panelH, 28)
  ctx.fillStyle = C.glassPanel
  ctx.fill()
  ctx.strokeStyle = C.glassBorder
  ctx.lineWidth = 1
  ctx.stroke()

  // Línea de acento izquierda del panel
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.moveTo(panelX + 28, statsTop)
  ctx.arcTo(panelX + 14, statsTop, panelX, statsTop + 14, 14)
  ctx.lineTo(panelX, statsTop + 14)
  ctx.closePath()
  // solo dibujar la línea de acento lateral
  ctx.fillStyle = accentColor
  ctx.fillRect(panelX, statsTop + 4, 4, panelH - 32)

  // Título del bloque
  ctx.fillStyle = C.textMuted
  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('MI PROGRESO', panelX + 44, statsTop + 52)

  // Números grandes en fila
  const statRowY = statsTop + 130
  const colW = panelW / 3
  const statLbls = [
    { val: `${aprobadas}/${totalMaterias}`, lbl: 'materias' },
    { val: `${horas}`, lbl: `de ${HORAS_TOTALES_OBLIGATORIAS} hs` },
    { val: `${pct}%`, lbl: 'completado' },
  ]
  statLbls.forEach((s, i) => {
    const cx = panelX + colW * i + colW / 2
    ctx.fillStyle = C.textWhite
    ctx.font = `700 ${s.val.length > 5 ? '50' : '60'}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s.val, cx, statRowY)
    ctx.fillStyle = C.textMuted
    ctx.font = '400 22px Inter, system-ui, sans-serif'
    ctx.fillText(s.lbl, cx, statRowY + 36)
  })

  // Divisores entre columnas
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  for (let i = 1; i < 3; i++) {
    const lx = panelX + colW * i
    ctx.beginPath()
    ctx.moveTo(lx, statsTop + 80)
    ctx.lineTo(lx, statsTop + 200)
    ctx.stroke()
  }

  // Barra de progreso general
  const barY = statsTop + 240
  const barX = panelX + 40
  const barW = panelW - 80
  const barH = 20
  drawRoundRect(ctx, barX, barY, barW, barH, 10)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  const filledW = Math.max((pct / 100) * barW, 0)
  if (filledW > 0) {
    const barGrad = ctx.createLinearGradient(barX, 0, barX + filledW, 0)
    barGrad.addColorStop(0, accentColor + 'cc')
    barGrad.addColorStop(1, accentColor)
    drawRoundRect(ctx, barX, barY, filledW, barH, 10)
    ctx.fillStyle = barGrad
    ctx.fill()
  }
  ctx.fillStyle = C.textMuted
  ctx.font = '400 20px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('Progreso de carrera', barX, barY + barH + 28)
  ctx.textAlign = 'right'
  ctx.fillStyle = accentColor
  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillText(`${pct}%`, barX + barW, barY + barH + 28)

  // Barras por año (1°–6°)
  const yearZoneY = statsTop + 340
  const yearBarH = 14
  const yearCols = 3
  const yearColW = (panelW - 80) / yearCols
  const yearRowH = 90

  ctx.font = '500 20px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  for (let anio = 1; anio <= 6; anio++) {
    const col = (anio - 1) % yearCols
    const row = Math.floor((anio - 1) / yearCols)
    const yx = panelX + 40 + col * yearColW
    const yy = yearZoneY + row * yearRowH
    const yw = yearColW - 24

    const materiasAnio = MATERIAS.filter((m) => m.anio === anio)
    const aprobadasAnio = materiasAnio.filter((m) => {
      const e = estados[m.id]
      return e && (e.estado === 'final_aprobado' || e.estado === 'promocionada')
    }).length
    const pctAnio = materiasAnio.length > 0 ? aprobadasAnio / materiasAnio.length : 0

    // Label año
    ctx.fillStyle = C.textMuted
    ctx.fillText(`${anio}°`, yx + yw / 2, yy)

    // Barra fondo
    drawRoundRect(ctx, yx, yy + 8, yw, yearBarH, 7)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()

    // Barra fill
    if (pctAnio > 0) {
      const fillW = pctAnio * yw
      drawRoundRect(ctx, yx, yy + 8, fillW, yearBarH, 7)
      ctx.fillStyle = pctAnio === 1 ? accentColor : accentColor + '88'
      ctx.fill()
    }

    // Porcentaje
    ctx.fillStyle = pctAnio === 1 ? accentColor : C.textMuted
    ctx.font = `${pctAnio === 1 ? '600' : '400'} 18px Inter, system-ui, sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(pctAnio * 100)}%`, yx + yw, yy + barH + 38)
    ctx.textAlign = 'center'
    ctx.font = '500 20px Inter, system-ui, sans-serif'
  }

  // ── FOOTER (y: 1750 → 1920) ──────────────────────────────────────────────────
  ctx.fillStyle = C.textMuted
  ctx.font = '400 24px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('fauu-tracker.vercel.app', W / 2, 1830)

  // Motivo decorativo (puntos en línea)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.arc(W / 2 - 40 + i * 20, 1875, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Banda inferior
  ctx.fillStyle = accentColor
  ctx.fillRect(0, H - 6, W, 6)

  return canvas
}

// ---------- componente principal ----------

export function ShareHito({ hito, nombre, estados, onClose }: ShareHitoProps) {
  const [saving, setSaving]             = useState(false)
  const [done, setDone]                 = useState(false)
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

  const esLogro     = hito.tipo === 'logro'
  const emojiHito   = esLogro ? hito.logro.emoji : '✅'
  const tituloHito  = esLogro ? `¡${hito.logro.nombre}!` : `¡Aprobé ${hito.nombre}!`
  const subtituloHito = esLogro
    ? hito.logro.descripcion
    : (hito.nota ? `Nota final: ${hito.nota} 🎉` : 'Materia aprobada')

  const generateImage = useCallback((): HTMLCanvasElement | null => {
    return buildCanvas(
      tituloHito, subtituloHito, emojiHito, esLogro,
      nombre, aprobadas, totalMaterias, horas, pct, estados
    )
  }, [tituloHito, subtituloHito, emojiHito, esLogro, nombre, aprobadas, totalMaterias, horas, pct, estados])

  useEffect(() => {
    const canvas = generateImage()
    if (!canvas) return
    setImageDataUrl(canvas.toDataURL('image/png'))
    canvas.toBlob((b) => { blobRef.current = b }, 'image/png')
  }, [generateImage])

  const getBlob = useCallback(async (): Promise<Blob | null> => {
    if (blobRef.current) return blobRef.current
    const canvas = generateImage()
    if (!canvas) return null
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  }, [generateImage])

  const filename = esLogro
    ? `fauu-tracker-logro.png`
    : `fauu-tracker-${hito.nombre.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}.png`

  const handleDownload = useCallback(async () => {
    setSaving(true)
    try {
      const blob = await getBlob()
      if (!blob) return
      blobRef.current = blob

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as unknown as {
            showSaveFilePicker: (opts: Record<string, unknown>) => Promise<FileSystemFileHandle>
          }).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'Imagen PNG', accept: { 'image/png': ['.png'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          setDone(true)
          setTimeout(() => setDone(false), 3000)
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }

      // Fallback: descarga directa
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      console.error('Error guardando imagen:', err)
    } finally {
      setSaving(false)
    }
  }, [getBlob, filename])

  const handleShare = useCallback(async () => {
    setSaving(true)
    try {
      const blob = await getBlob()
      if (!blob) return
      blobRef.current = blob
      const file = new File([blob], filename, { type: 'image/png' })

      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: tituloHito,
          text: `${tituloHito} 🏗️ #FAUUTracker #Arquitectura`,
          files: [file],
        })
        setDone(true)
        setTimeout(() => setDone(false), 3000)
      } else {
        await handleDownload()
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Error compartiendo:', err)
    } finally {
      setSaving(false)
    }
  }, [getBlob, filename, tituloHito, handleDownload])

  // ── Vista full preview ──────────────────────────────────────────────────────
  if (showFullPreview && imageDataUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <p className="text-center text-xs text-white/60">
            Clic derecho → &quot;Guardar imagen como...&quot; o usá el botón de abajo
          </p>
          <div className="relative overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: '9/16' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt={tituloHito}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Guardar
            </button>
            <button
              onClick={() => setShowFullPreview(false)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white backdrop-blur hover:bg-white/20 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Modal principal ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border bg-card shadow-2xl overflow-hidden">
        {/* Borde superior con acento */}
        <div
          className="h-1 w-full"
          style={{ background: esLogro ? '#f5c842' : '#2d6a4f' }}
        />

        <div className="p-5 space-y-4">
          {/* Header del modal */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-semibold">
                {esLogro ? '🏆 Compartir logro' : '✅ Compartir materia'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Imagen lista para compartir en stories de Instagram o WhatsApp
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preview 9:16 */}
          <div
            className="w-full overflow-hidden rounded-xl border shadow-sm bg-[#1e3a5f] cursor-pointer"
            style={{ aspectRatio: '9/16', maxHeight: '45vh' }}
            onClick={() => setShowFullPreview(true)}
            title="Clic para ver en grande"
          >
            {imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageDataUrl}
                alt={tituloHito}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Tocá la imagen para verla completa
          </p>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleShare}
              disabled={saving || !imageDataUrl}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: esLogro ? '#f5c842' : '#2d6a4f',
                color: esLogro ? '#1a1a1a' : '#ffffff',
              }}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                  Compartiendo...
                </>
              ) : done ? (
                <>
                  <Check className="h-4 w-4" />
                  ¡Enviado!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Compartir en Stories
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={saving || !imageDataUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
              title="Guardar imagen"
            >
              {done ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
