import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log("🔍 Middleware running on:", req.nextUrl.pathname);
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Set a timeout for the session check
  const sessionPromise = Promise.race([
    supabase.auth.getSession(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 2000)
    )
  ]);

  try {
    // Use the timeout-protected session check
    const { data: { session } } = await sessionPromise as any;
    console.log("🔑 Session check result:", !!session);
    
    // Define public routes that don't require authentication
    const publicRoutes = [
      '/auth', 
      '/api/public', 
      '/',              // Make homepage public
      '/auth/callback', 
      '/auth/debug',    
      '/_next',        
      '/favicon.ico',
      '/appspecific'    // Ignore Chrome DevTools paths
    ];
    const isPublicRoute = publicRoutes.some(route => {
      // Special case for root path or empty path
      if ((route === '/' && (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '')) || 
          req.nextUrl.pathname.startsWith(route)) {
        console.log("✅ Public route detected:", req.nextUrl.pathname);
        return true;
      }
      return false;
    });

    // Define routes that require authentication
    const protectedPaths = [
      '/dashboard', 
      '/calendar', 
      '/tasks', 
      '/inventory', 
      '/manual'
    ];
    const isProtectedRoute = protectedPaths.some(path => {
      // Make sure empty paths are never protected
      if (req.nextUrl.pathname === '' || req.nextUrl.pathname === '/') {
        return false;
      }
      return req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/');
    });

    // Redirect logic
    if (!session && isProtectedRoute && !isPublicRoute) {
      // Prevent redirect loops and empty path redirects
      if (req.nextUrl.pathname !== '/auth' && req.nextUrl.pathname !== '' && req.nextUrl.pathname !== '/') {
        console.log("🔒 Redirecting to auth from", req.nextUrl.pathname);
        const redirectUrl = new URL('/auth', req.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    if (session && req.nextUrl.pathname === '/auth') {
      console.log("🔓 Already authenticated, redirecting to dashboard");
      const redirectUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error("❌ Session check failed:", error);
    // Allow the request to proceed rather than getting stuck
    return res;
  }

  return res
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}