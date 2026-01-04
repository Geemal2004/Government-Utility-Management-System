'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    CustomerData,
    getCustomerToken,
    getCustomerData,
    setCustomerToken,
    setCustomerData,
    removeCustomerToken,
    isCustomerAuthenticated,
    getCustomerAuthHeader,
} from '@/lib/auth/customerAuth';

interface CustomerContextType {
    customer: CustomerData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, customer: CustomerData, remember?: boolean) => void;
    logout: () => void;
    refreshCustomerData: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Initialize authentication state
    useEffect(() => {
        const initAuth = () => {
            const authenticated = isCustomerAuthenticated();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const customerData = getCustomerData();
                setCustomer(customerData);
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    /**
     * Login function
     */
    const login = (token: string, customerData: CustomerData, remember: boolean = false) => {
        setCustomerToken(token, remember);
        setCustomerData(customerData, remember);
        setCustomer(customerData);
        setIsAuthenticated(true);
    };

    /**
     * Logout function
     */
    const logout = () => {
        removeCustomerToken();
        setCustomer(null);
        setIsAuthenticated(false);
        router.push('/auth/customer-login');
    };

    /**
     * Refresh customer data from API
     */
    const refreshCustomerData = async () => {
        if (!isAuthenticated) return;

        try {
            const response = await fetch('/api/v1/customers/me', {
                headers: getCustomerAuthHeader(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch customer data');
            }

            const customerData = await response.json();

            // Determine if we should use localStorage or sessionStorage
            const remember = localStorage.getItem('customerToken') !== null;
            setCustomerData(customerData, remember);
            setCustomer(customerData);
        } catch (error) {
            console.error('Failed to refresh customer data:', error);
            // If refresh fails, logout
            logout();
        }
    };

    const value: CustomerContextType = {
        customer,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshCustomerData,
    };

    return (
        <CustomerContext.Provider value={value}>
            {children}
        </CustomerContext.Provider>
    );
}

/**
 * useCustomerAuth hook
 * Access customer authentication state and functions
 */
export function useCustomerAuth() {
    const context = useContext(CustomerContext);

    if (context === undefined) {
        throw new Error('useCustomerAuth must be used within a CustomerProvider');
    }

    return context;
}
