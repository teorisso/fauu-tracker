'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/global-error]', error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
          background: '#0f172a',
          color: '#e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1.25rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '3rem', lineHeight: 1, color: '#475569', userSelect: 'none' }}>!</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Error crítico</h1>
          <p style={{ maxWidth: '360px', color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Ocurrió un error grave en la aplicación. Por favor recargá la página.
            {error.digest && (
              <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  )
}
