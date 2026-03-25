import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e3a5f',
          borderRadius: 7,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: '-1px',
            lineHeight: 1,
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size }
  )
}
