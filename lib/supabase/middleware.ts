import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/callback')

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname.startsWith('/callback'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/materias'
    return NextResponse.redirect(url)
  }

  // Si el usuario ya está logueado y entra a la landing, mandarlo al dashboard
  if (user && pathname === '/') {
    // #region agent log
    fetch('http://127.0.0.1:7697/ingest/e080e4ee-63b6-4399-b44a-e2083cc27737',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'260da6'},body:JSON.stringify({sessionId:'260da6',location:'lib/supabase/middleware.ts:51',message:'redirect_authenticated_root_to_materias',data:{pathname},hypothesisId:'H1-H3',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const url = request.nextUrl.clone()
    url.pathname = '/materias'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
