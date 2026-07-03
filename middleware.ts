import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('nekoapi_token')?.value;
  const { pathname } = req.nextUrl;

  // Protect the dashboard and admin page
  const protectedPaths = ['/'];
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(path + '/'));

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isProtected && !token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
