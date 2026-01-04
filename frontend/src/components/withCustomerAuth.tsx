'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerContext';

/**
 * Higher-Order Component to protect customer routes
 * Redirects to login if not authenticated
 */
export function withCustomerAuth<P extends object>(
    Component: React.ComponentType<P>
) {
    return function ProtectedRoute(props: P) {
        const { isAuthenticated, isLoading } = useCustomerAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/auth/customer-login');
            }
        }, [isAuthenticated, isLoading, router]);

        // Show loading state while checking authentication
        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        // Don't render component if not authenticated
        if (!isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
}
