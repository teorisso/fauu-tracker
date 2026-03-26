'use client'

import { LayoutList, CalendarDays, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CalendarView = 'lista' | 'mes' | 'timeline'

interface CalendarViewToggleProps {
  view: CalendarView
  onChange: (v: CalendarView) => void
}

const OPTIONS: Array<{ value: CalendarView; label: string; Icon: React.ElementType }> = [
  { value: 'lista', label: 'Lista', Icon: LayoutList },
  { value: 'mes', label: 'Mes', Icon: CalendarDays },
  { value: 'timeline', label: 'Timeline', Icon: BarChart2 },
]

export function CalendarViewToggle({ view, onChange }: CalendarViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-1 gap-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            view === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
