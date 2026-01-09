/**
 * Customer Authentication Utilities
 * Separate from employee authentication
 */

import { jwtDecode } from 'jwt-decode';

const CUSTOMER_TOKEN_KEY = 'customerToken';
const CUSTOMER_DATA_KEY = 'customerData';
const COOKIE_MAX_AGE_DAYS = 30; // 30 days for remember me

export interface CustomerData {
    customerId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
}

export interface DecodedToken {
    sub: number;
    email: string;
    exp: number;
    iat: number;
}

/**
 * Helper function to get cookie security flags
 */
function getCookieSecurityFlags(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    return `; path=/; SameSite=Lax${secureFlag}`;
}

/**
 * Get customer token from storage
 */
export function getCustomerToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Check localStorage first (remember me)
    let token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

    // Then check sessionStorage
    if (!token) {
        token = sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
    }

    return token;
}

/**
 * Set customer token in storage
 */
export function setCustomerToken(token: string, remember: boolean = false): void {
    if (typeof window === 'undefined') return;

    const securityFlags = getCookieSecurityFlags();

    if (remember) {
        localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
        // Set cookie with longer expiry (30 days)
        const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60; // Convert days to seconds
        document.cookie = `customerToken=${token}${securityFlags}; max-age=${maxAge}`;
    } else {
        sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
        // Set session cookie (expires when browser closes)
        document.cookie = `customerToken=${token}${securityFlags}`;
    }
}

/**
 * Remove customer token from storage
 */
export function removeCustomerToken(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_DATA_KEY);
    sessionStorage.removeItem(CUSTOMER_DATA_KEY);
    
    // Remove cookie by setting max-age to 0 (use same security flags for proper cleanup)
    const securityFlags = getCookieSecurityFlags();
    document.cookie = `customerToken=;${securityFlags}; max-age=0`;
}

/**
 * Get customer data from storage
 */
export function getCustomerData(): CustomerData | null {
    if (typeof window === 'undefined') return null;

    // Check localStorage first
    let data = localStorage.getItem(CUSTOMER_DATA_KEY);

    // Then check sessionStorage
    if (!data) {
        data = sessionStorage.getItem(CUSTOMER_DATA_KEY);
    }

    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

/**
 * Set customer data in storage
 */
export function setCustomerData(customer: CustomerData, remember: boolean = false): void {
    if (typeof window === 'undefined') return;

    const dataString = JSON.stringify(customer);

    if (remember) {
        localStorage.setItem(CUSTOMER_DATA_KEY, dataString);
    } else {
        sessionStorage.setItem(CUSTOMER_DATA_KEY, dataString);
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;

        // Add 5 minute buffer
        return decoded.exp < currentTime + 300;
    } catch {
        return true;
    }
}

/**
 * Validate token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
    if (!token) return false;

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
}

/**
 * Check if customer is authenticated
 */
export function isCustomerAuthenticated(): boolean {
    const token = getCustomerToken();

    if (!token) return false;
    if (!isValidTokenFormat(token)) return false;
    if (isTokenExpired(token)) {
        // Clean up expired token
        removeCustomerToken();
        return false;
    }

    return true;
}

/**
 * Get authorization header for API requests
 */
export function getCustomerAuthHeader(): Record<string, string> {
    const token = getCustomerToken();

    if (!token) return {};

    return {
        'Authorization': `Bearer ${token}`,
    };
}

/**
 * Decode customer token to get basic info
 */
export function decodeCustomerToken(token: string): DecodedToken | null {
    try {
        return jwtDecode<DecodedToken>(token);
    } catch {
        return null;
    }
}
