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
    return { ok: false, error: 'La clave VAPID pública está vacía. Revisá NEXT_PUBLIC_VAPID_PUBLIC_KEY.' }
  }
  let buf: Uint8Array
  try {
    buf = urlBase64ToUint8Array(s)
  } catch {
    return {
      ok: false,
      error:
        'La clave VAPID no es base64 válido. Copiá la Public Key completa, una sola línea, sin comillas.',
    }
  }
  if (buf.length !== VAPID_PUBLIC_UNCOMPRESSED_LENGTH) {
    return {
      ok: false,
      error: `Clave VAPID pública inválida (${buf.length} bytes; se esperan ${VAPID_PUBLIC_UNCOMPRESSED_LENGTH}). Revisá Vercel: sin saltos de línea ni comillas dentro del valor.`,
    }
  }
  if (buf[0] !== 0x04) {
    return {
      ok: false,
      error:
        'Formato de clave VAPID no reconocido. Usá el par generado con `npx web-push generate-vapid-keys`.',
    }
  }
  return { ok: true, key: buf }
}

export async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

/** Mensaje de ayuda cuando el navegador falla al hablar con el servicio de push (p. ej. FCM). */
export function formatPushSubscribeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (
    lower.includes('push service error') ||
    lower.includes('registration failed') ||
    (lower.includes('networkerror') && lower.includes('push'))
  ) {
    return (
      'No se pudo registrar el push en el navegador. En Vercel configurá `VAPID_PUBLIC_KEY` con la Public Key ' +
      '(una línea, sin comillas), redeploy, y comprobá en el navegador la URL `/api/vapid-public` (debe devolver JSON con publicKey). ' +
      'La misma public key debe coincidir con el par en Supabase (VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY).'
    )
  }
  return msg
}
