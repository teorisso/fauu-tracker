/** Preferencias de alertas — alineado a `notification_preferences.alert_rules` (jsonb). */

export type AlertScope = 'regularidad' | 'mesa'
export type AlertChannel = 'email' | 'push'
export type AlertUnit = 'days' | 'weeks'

export interface AlertRule {
  scope: AlertScope
  channel: AlertChannel
  amount: number
  unit: AlertUnit
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  { scope: 'regularidad', channel: 'email', amount: 60, unit: 'days' },
]

export function alertLeadDays(rule: AlertRule): number {
  const n = Math.floor(Number(rule.amount))
  if (!Number.isFinite(n) || n < 1) return 1
  return rule.unit === 'weeks' ? n * 7 : n
}

export function parseAlertRules(raw: unknown): AlertRule[] {
  if (!Array.isArray(raw)) return [...DEFAULT_ALERT_RULES]
  const out: AlertRule[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const scope = r.scope === 'mesa' ? 'mesa' : 'regularidad'
    const channel = r.channel === 'push' ? 'push' : 'email'
    const unit = r.unit === 'weeks' ? 'weeks' : 'days'
    const amount = Math.max(1, Math.floor(Number(r.amount)) || 1)
    out.push({ scope, channel, amount, unit })
  }
  return out.length > 0 ? out : [...DEFAULT_ALERT_RULES]
}
