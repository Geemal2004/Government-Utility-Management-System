"use client";

import { CustomerProvider } from "@/contexts/CustomerContext";
import { AuthProvider } from "@/context/AuthContext";

/**
 * Client-side providers wrapper
 * Wraps the app with all necessary context providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <CustomerProvider>
                {children}
            </CustomerProvider>
        </AuthProvider>
    );
}

