'use client'

import { useState } from 'react'
import { MateriaEstado, Seminario, LogroDesbloqueado } from '@/lib/types'
import { LogrosPanel } from '@/components/gamification/LogrosPanel'
import { HeatmapActividad } from '@/components/gamification/HeatmapActividad'
import { ShareHito, HitoTipo } from '@/components/gamification/ShareCard'

interface PerfilGamificationProps {
  nombre: string
  estados: Record<string, MateriaEstado>
  seminarios: Seminario[]
}

export function PerfilGamification({
  nombre,
  estados,
  seminarios,
}: PerfilGamificationProps) {
  const [shareHito, setShareHito] = useState<HitoTipo | null>(null)

  function handleCompartirLogro(l: LogroDesbloqueado) {
    setShareHito({ tipo: 'logro', logro: l.logro })
  }

  return (
    <div className="space-y-8">
      {/* Logros expandidos */}
      <LogrosPanel
        estados={estados}
        seminarios={seminarios}
        onCompartirLogro={handleCompartirLogro}
      />

      {/* Heatmap completo */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Actividad académica</h3>
        <p className="text-xs text-muted-foreground">
          Historial de aprobaciones y regularidades de los últimos 12 meses
        </p>
        <HeatmapActividad estados={estados} />
      </div>

      {/* Modal de compartir hito */}
      {shareHito && (
        <ShareHito
          hito={shareHito}
          nombre={nombre}
          estados={estados}
          onClose={() => setShareHito(null)}
        />
      )}
    </div>
  )
}
