/** Utilidades Web Push en el cliente (VAPID público). */

/** Clave pública VAPID sin comprimir (P-256), formato habitual de `web-push generate-vapid-keys`. */
export const VAPID_PUBLIC_UNCOMPRESSED_LENGTH = 65

/**
 * Limpia el valor copiado desde Vercel / .env (espacios, comillas envolventes).
 */
export function sanitizeVapidPublicKey(raw: string): string {
  let s = raw.trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }
  return s
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Decodifica y valida la clave pública para `PushManager.subscribe`.
 * Devuelve error legible si el formato no coincide con lo que espera el navegador.
 */
export function parseVapidApplicationServerKey(raw: string):
  | { ok: true; key: Uint8Array }
  | { ok: false; error: string } {
  const s = sanitizeVapidPublicKey(raw)
  if (!s) {
    return {
      ok: false,
      error:
        'Las notificaciones del navegador no están disponibles en este momento. Intentá más tarde.',
    }
  }
  let buf: Uint8Array
  try {
    buf = urlBase64ToUint8Array(s)
  } catch {
    return {
      ok: false,
      error:
        'No pudimos activar las notificaciones. Probá de nuevo más tarde o con otro navegador.',
    }
  }
  if (buf.length !== VAPID_PUBLIC_UNCOMPRESSED_LENGTH) {
    return {
      ok: false,
      error:
        'No pudimos activar las notificaciones. Probá de nuevo más tarde o con otro navegador.',
    }
  }
  if (buf[0] !== 0x04) {
    return {
      ok: false,
      error:
        'No pudimos activar las notificaciones. Probá de nuevo más tarde o con otro navegador.',
    }
  }
  return { ok: true, key: buf }
}

export async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

type PushSubscribeErrorContext = {
  notificationPermission?: NotificationPermission | 'unsupported'
  userAgent?: string
  isSecureContext?: boolean
}

/** Mensaje amigable cuando falla la suscripción al servicio de push del navegador. */
export function formatPushSubscribeError(
  err: unknown,
  context?: PushSubscribeErrorContext
): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  const permission = context?.notificationPermission
  const userAgent = (context?.userAgent ?? '').toLowerCase()
  const isChromium = userAgent.includes('chrome') || userAgent.includes('edg') || userAgent.includes('brave')

  if (context?.isSecureContext === false) {
    return 'No pudimos activar las notificaciones porque esta página no está en un contexto seguro (HTTPS).'
  }

  if (
    permission === 'denied' ||
    lower.includes('notallowederror') ||
    lower.includes('permission denied') ||
    lower.includes('permission has been denied')
  ) {
    return (
      'Las notificaciones están bloqueadas en este navegador. Permitilas para este sitio y recargá la página. ' +
      'Si estás en modo incógnito/privado, probá en una ventana normal.'
    )
  }

  if (lower.includes('incognito') || lower.includes('private browsing')) {
    return 'En modo incógnito/privado el navegador puede bloquear push. Probá activar en una ventana normal.'
  }

  if (
    lower.includes('push service error') ||
    lower.includes('registration failed') ||
    (lower.includes('networkerror') && lower.includes('push')) ||
    (lower.includes('network') && lower.includes('push')) ||
    lower.includes('aborterror')
  ) {
    if (isChromium) {
      return (
        'No pudimos registrar las notificaciones push en este navegador. Revisá permisos del sitio (candado -> Notificaciones: Permitir). ' +
        'Si usás Brave, abrí brave://settings/privacy y activá "Use Google services for push messaging".'
      )
    }
    return (
      'No pudimos activar las notificaciones en este dispositivo. Probá de nuevo más tarde, actualizá la página o usá otro navegador.'
    )
  }
  if (isChromium) {
    return (
      'No pudimos activar las notificaciones. Si usás Brave, abrí brave://settings/privacy y activá "Use Google services for push messaging".'
    )
  }
  return 'No pudimos activar las notificaciones. Probá de nuevo más tarde.'
}
