/**
 * Generador de archivos ICS (iCalendar) para exportar eventos de mesas de examen.
 */

interface ICSEvent {
  uid: string
  title: string
  date: string        // YYYY-MM-DD
  startTime?: string  // HH:MM (24h)
  endTime?: string    // HH:MM (24h)
  description?: string
  location?: string
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatICSDate(iso: string, time?: string): string {
  const [y, m, d] = iso.split('-')
  if (!time) return `${y}${m}${d}`
  const [h, min] = time.split(':')
  return `${y}${m}${d}T${h}${min}00`
}

function now(): string {
  return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
}

export function generateICS(events: ICSEvent[], calName = 'Mesas FAU-UNNE'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FAUU-Tracker//FAU UNNE//ES',
    `X-WR-CALNAME:${escapeICS(calName)}`,
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const ev of events) {
    const isAllDay = !ev.startTime
    const dtStart = isAllDay
      ? `DTSTART;VALUE=DATE:${formatICSDate(ev.date)}`
      : `DTSTART;TZID=America/Argentina/Buenos_Aires:${formatICSDate(ev.date, ev.startTime)}`

    let dtEnd: string
    if (isAllDay) {
      // All-day events: DTEND = next day
      const endDate = new Date(ev.date + 'T12:00:00')
      endDate.setDate(endDate.getDate() + 1)
      dtEnd = `DTEND;VALUE=DATE:${endDate.toISOString().slice(0, 10).replace(/-/g, '')}`
    } else if (ev.endTime) {
      dtEnd = `DTEND;TZID=America/Argentina/Buenos_Aires:${formatICSDate(ev.date, ev.endTime)}`
    } else {
      // Default 2h duration
      const [h, min] = ev.startTime!.split(':').map(Number)
      const endH = String(h + 2).padStart(2, '0')
      dtEnd = `DTEND;TZID=America/Argentina/Buenos_Aires:${formatICSDate(ev.date, `${endH}:${min.toString().padStart(2, '0')}`)}`
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}@fauu-tracker`,
      `DTSTAMP:${now()}`,
      dtStart,
      dtEnd,
      `SUMMARY:${escapeICS(ev.title)}`,
      ev.description ? `DESCRIPTION:${escapeICS(ev.description)}` : '',
      ev.location ? `LOCATION:${escapeICS(ev.location)}` : '',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  return lines.filter(Boolean).join('\r\n') + '\r\n'
}

export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

export function buildGCalUrl(params: {
  title: string
  date: string
  startTime?: string
  endTime?: string
  description?: string
  location?: string
}): string {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const title = encodeURIComponent(params.title)

  let dates: string
  if (params.startTime) {
    const [y, m, d] = params.date.split('-')
    const [sh, sm] = params.startTime.split(':')
    const endH = params.endTime
      ? params.endTime.split(':')[0]
      : String(parseInt(sh) + 2).padStart(2, '0')
    const endM = params.endTime ? params.endTime.split(':')[1] : sm
    dates = `${y}${m}${d}T${sh}${sm}00/${y}${m}${d}T${endH}${endM}00`
  } else {
    const dateStr = params.date.replace(/-/g, '')
    const endDate = new Date(params.date + 'T12:00:00')
    endDate.setDate(endDate.getDate() + 1)
    const endStr = endDate.toISOString().slice(0, 10).replace(/-/g, '')
    dates = `${dateStr}/${endStr}`
  }

  const parts = [
    `${base}`,
    `text=${title}`,
    `dates=${dates}`,
    params.description ? `details=${encodeURIComponent(params.description)}` : '',
    params.location ? `location=${encodeURIComponent(params.location)}` : '',
  ]

  return parts.filter(Boolean).join('&')
}
