import { registerAs } from '@nestjs/config';

/**
 * Stripe configuration
 * Loads Stripe API keys from environment variables
 */
export default registerAs('stripe', () => ({
    /**
     * Stripe Secret Key (required)
     * Used for server-side API calls
     */
    secretKey: process.env.STRIPE_SECRET_KEY,

    /**
     * Stripe Publishable Key (required)
     * Used for client-side Stripe.js
     */
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,

    /**
     * Stripe Webhook Secret (required for webhooks)
     * Used to verify webhook signatures
     */
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

    /**
     * Currency for payments (default: LKR for Sri Lanka)
     */
    currency: process.env.STRIPE_CURRENCY || 'lkr',

    /**
     * Success URL after payment
     */
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payments/success',

    /**
     * Cancel URL if payment is cancelled
     */
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payments/cancel',

    /**
     * API version to use
     */
    apiVersion: '2024-12-18.acacia' as const,
}));

/**
 * Stripe configuration interface for type safety
 */
export interface StripeConfig {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    apiVersion: string;
}
