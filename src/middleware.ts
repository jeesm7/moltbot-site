import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/admin', '/onboarding', '/waitlist'];

// Admin routes that require admin email
const adminRoutes = ['/admin'];

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());

// Invite-only gate
const ALLOWED_EMAILS = ["jessmason23@gmail.com"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create response with security headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;"
  );

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Create Supabase client for auth check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user is in allowlist (invite-only gate)
    const userEmail = user.email || '';
    if (!ALLOWED_EMAILS.includes(userEmail) && !ADMIN_EMAILS.includes(userEmail)) {
      // User not in allowlist — redirect to waitlist
      if (pathname !== '/waitlist') {
        return NextResponse.redirect(new URL('/waitlist', request.url));
      }
    }

    // Check admin access
    if (isAdminRoute && !ADMIN_EMAILS.includes(userEmail)) {
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
