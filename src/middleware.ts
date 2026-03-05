import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedRoutes = ['/admin', '/api/site/settings', '/api/suggestions', '/api/admin'];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

    if (isProtectedRoute) {
        // Skip auth for strictly public paths within admin if any existed (none do currently)

        const cookie = req.cookies.get('admin_session')?.value;
        const session = await verifyToken(cookie);

        if (!session || !session.admin) {
            // API routes receive 401
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized sequence.' }, { status: 401 });
            }
            // Admin UI pages could theoretically redirect, but since this is a decoupled frontend it might just show a 401 error boundary locally. 
            // For now, redirecting to home is standard.
            return NextResponse.redirect(new URL('/', req.nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
