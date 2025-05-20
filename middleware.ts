import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/auth', 
  '/api/public', 
  '/',              // Make homepage public
  '/auth/callback', 
  '/auth/debug',    
  '/_next',        
  '/favicon.ico',
  '/appspecific'
];

const PROTECTED_ROUTES = [
  '/dashboard', 
  '/calendar', 
  '/tasks', 
  '/inventory', 
  '/manual',
  '/admin'  // Add this line to protect all admin routes
];

// Make route protection more robust
const isProd = process.env.NODE_ENV === 'production';
const protectionLevel = isProd ? 'strict' : 'relaxed';

// Use this to determine how strictly to enforce permissions
export async function middleware(req: NextRequest) {
  console.log("🔍 Middleware running on:", req.nextUrl.pathname);
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Define route checks outside the try/catch blocks
  // Define public routes that don't require authentication
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Special case for root path or empty path
    if ((route === '/' && (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '')) || 
        req.nextUrl.pathname.startsWith(route)) {
      console.log("✅ Public route detected:", req.nextUrl.pathname);
      return true;
    }
    return false;
  });

  // Define routes that require authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(path => {
    // Make sure empty paths are never protected
    if (req.nextUrl.pathname === '' || req.nextUrl.pathname === '/') {
      return false;
    }
    return req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/');
  });

  // Set a timeout for the session check
  const sessionPromise = Promise.race([
    supabase.auth.getSession(),
    new Promise<{data: {session: null}}>((_, reject) => 
      setTimeout(() => reject(new Error('Session check timeout')), 2000)
    )
  ]);

  try {
    // Use the timeout-protected session check
    const { data: { session } } = await sessionPromise;
    // Only log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log("🔑 Session check result:", !!session);
    }

    // Add special case for manual pages
    if (session && req.nextUrl.pathname.startsWith('/manual')) {
      // Allow any authenticated user to access manual pages
      return res;
    }

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
    
    // For protected routes, redirect to auth on error
    if (isProtectedRoute && !isPublicRoute) {
      const redirectUrl = new URL('/auth', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // For public routes, allow access
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