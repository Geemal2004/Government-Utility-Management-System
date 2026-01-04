"use client";

import { CustomerProvider } from "@/contexts/CustomerContext";

/**
 * Client-side providers wrapper
 * Wraps the app with all necessary context providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CustomerProvider>
            {children}
        </CustomerProvider>
    );
}
