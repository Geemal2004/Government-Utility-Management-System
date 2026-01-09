import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for protecting customer routes
 * 
 * This middleware:
 * 1. Checks if customer is authenticated for /customer/* routes
 * 2. Redirects to /customer-login if not authenticated
 * 3. Allows access if authenticated
 * 
 * Separate from employee authentication
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if this is a customer route
    if (pathname.startsWith('/customer')) {
        // Exclude login and public pages
        const publicCustomerPages = [
            '/auth/customer-login',
            '/customer/register',
            '/customer/forgot-password',
            '/customer/reset-password',
        ];

        // Allow access to public pages
        if (publicCustomerPages.some(page => pathname.startsWith(page))) {
            return NextResponse.next();
        }

        // Check for customer token in cookies (set by client-side)
        const customerToken = request.cookies.get('customerToken')?.value;

        // If no token, redirect to login
        if (!customerToken) {
            const loginUrl = new URL('/auth/customer-login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // TODO: Optionally verify token here
        // For now, just check if it exists

        // Token exists, allow access
        return NextResponse.next();
    }

    // Not a customer route, continue
    return NextResponse.next();
}

/**
 * Configure which routes this middleware applies to
 */
export const config = {
    matcher: [
        '/customer/:path*',
    ],
};
