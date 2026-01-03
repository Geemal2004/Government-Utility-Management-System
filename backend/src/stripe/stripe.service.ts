import { Injectable, Inject, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * Line item for checkout session
 */
export interface CheckoutLineItem {
    billId: number;
    billNumber: string;
    description: string;
    amount: number;
}

/**
 * Metadata stored with Stripe payment
 */
export interface PaymentMetadata {
    billId?: string;
    billIds?: string;
    customerId?: string;
    customerEmail?: string;
    source?: string;
    [key: string]: string | undefined;
}

/**
 * Stripe Service
 * Handles all Stripe API interactions for payment processing
 */
@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);
    private readonly currency: string;
    private readonly successUrl: string;
    private readonly cancelUrl: string;

    constructor(
        @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
        private readonly configService: ConfigService,
    ) {
        this.currency = this.configService.get<string>('stripe.currency') || 'lkr';
        this.successUrl = this.configService.get<string>('stripe.successUrl') || '';
        this.cancelUrl = this.configService.get<string>('stripe.cancelUrl') || '';
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Amount Conversion Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Convert amount to smallest currency unit (cents/paise)
     * Stripe requires amounts in smallest currency unit
     */
    private toSmallestUnit(amount: number): number {
        return Math.round(amount * 100);
    }

    /**
     * Convert from smallest currency unit back to standard
     */
    private fromSmallestUnit(amount: number): number {
        return amount / 100;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Retry Logic
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Execute Stripe API call with retry logic
     */
    private async withRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        maxRetries: number = 3,
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                // Don't retry client errors (4xx)
                if (error instanceof Stripe.errors.StripeError) {
                    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                        this.logger.error(`${operationName} failed with client error: ${error.message}`);
                        throw error;
                    }
                }

                this.logger.warn(`${operationName} attempt ${attempt} failed: ${lastError.message}`);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 100;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        this.logger.error(`${operationName} failed after ${maxRetries} attempts`);
        throw lastError;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Payment Intent Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Create a Payment Intent for customer payment
     * 
     * @param amount - Amount in standard currency unit (e.g., dollars, rupees)
     * @param currency - Currency code (default: configured currency)
     * @param metadata - Metadata to attach to payment intent
     * @returns Payment Intent with client_secret for frontend
     */
    async createPaymentIntent(
        amount: number,
        metadata: PaymentMetadata,
        currency?: string,
    ): Promise<Stripe.PaymentIntent> {
        this.logger.log(`Creating payment intent for amount: ${amount} ${currency || this.currency}`);

        if (amount <= 0) {
            throw new BadRequestException('Payment amount must be greater than 0');
        }

        return this.withRetry(async () => {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: this.toSmallestUnit(amount),
                currency: currency || this.currency,
                metadata: metadata as Stripe.MetadataParam,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            this.logger.log(`Payment intent created: ${paymentIntent.id}`);
            return paymentIntent;
        }, 'createPaymentIntent');
    }

    /**
     * Retrieve a Payment Intent by ID
     */
    async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        this.logger.log(`Retrieving payment intent: ${paymentIntentId}`);

        return this.withRetry(async () => {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent;
        }, 'getPaymentIntent');
    }

    /**
     * Confirm a Payment Intent was successful
     */
    async confirmPayment(paymentIntentId: string): Promise<{
        success: boolean;
        paymentIntent: Stripe.PaymentIntent;
        chargeId: string | null;
    }> {
        this.logger.log(`Confirming payment intent: ${paymentIntentId}`);

        const paymentIntent = await this.getPaymentIntent(paymentIntentId);

        const success = paymentIntent.status === 'succeeded';
        const chargeId = paymentIntent.latest_charge as string | null;

        if (success) {
            this.logger.log(`Payment confirmed: ${paymentIntentId}, charge: ${chargeId}`);
        } else {
            this.logger.warn(`Payment not successful: ${paymentIntentId}, status: ${paymentIntent.status}`);
        }

        return {
            success,
            paymentIntent,
            chargeId,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Checkout Session Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Create a Checkout Session for one or multiple bills
     * 
     * @param lineItems - Array of bill line items
     * @param customerId - System customer ID
     * @param customerEmail - Customer email
     * @param successUrl - URL to redirect on success (optional, uses config default)
     * @param cancelUrl - URL to redirect on cancel (optional, uses config default)
     * @returns Checkout session with URL for redirect
     */
    async createCheckoutSession(
        lineItems: CheckoutLineItem[],
        customerId: number,
        customerEmail: string,
        successUrl?: string,
        cancelUrl?: string,
    ): Promise<Stripe.Checkout.Session> {
        this.logger.log(`Creating checkout session for customer ${customerId}, ${lineItems.length} items`);

        if (lineItems.length === 0) {
            throw new BadRequestException('At least one line item is required');
        }

        const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
        if (totalAmount <= 0) {
            throw new BadRequestException('Total amount must be greater than 0');
        }

        // Build Stripe line items
        const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = lineItems.map(item => ({
            price_data: {
                currency: this.currency,
                product_data: {
                    name: `Bill ${item.billNumber}`,
                    description: item.description,
                },
                unit_amount: this.toSmallestUnit(item.amount),
            },
            quantity: 1,
        }));

        // Build metadata
        const metadata: PaymentMetadata = {
            customerId: customerId.toString(),
            customerEmail: customerEmail,
            billIds: lineItems.map(item => item.billId).join(','),
            source: 'checkout_session',
        };

        return this.withRetry(async () => {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: stripeLineItems,
                mode: 'payment',
                success_url: `${successUrl || this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelUrl || this.cancelUrl,
                customer_email: customerEmail,
                metadata: metadata as Stripe.MetadataParam,
                payment_intent_data: {
                    metadata: metadata as Stripe.MetadataParam,
                },
            });

            this.logger.log(`Checkout session created: ${session.id}`);
            return session;
        }, 'createCheckoutSession');
    }

    /**
     * Retrieve a Checkout Session
     */
    async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
        this.logger.log(`Retrieving checkout session: ${sessionId}`);

        return this.withRetry(async () => {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['payment_intent', 'customer'],
            });
            return session;
        }, 'getCheckoutSession');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Refund Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Create a refund for a payment
     * 
     * @param paymentIntentId - Payment Intent ID to refund
     * @param amount - Amount to refund (optional, full refund if not specified)
     * @param reason - Refund reason
     * @returns Refund object
     */
    async refundPayment(
        paymentIntentId: string,
        amount?: number,
        reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
    ): Promise<Stripe.Refund> {
        this.logger.log(`Processing refund for payment intent: ${paymentIntentId}, amount: ${amount || 'full'}`);

        const refundParams: Stripe.RefundCreateParams = {
            payment_intent: paymentIntentId,
        };

        if (amount) {
            refundParams.amount = this.toSmallestUnit(amount);
        }

        if (reason) {
            refundParams.reason = reason;
        }

        return this.withRetry(async () => {
            const refund = await this.stripe.refunds.create(refundParams);
            this.logger.log(`Refund created: ${refund.id}, status: ${refund.status}`);
            return refund;
        }, 'refundPayment');
    }

    /**
     * Get refund by ID
     */
    async getRefund(refundId: string): Promise<Stripe.Refund> {
        this.logger.log(`Retrieving refund: ${refundId}`);

        return this.withRetry(async () => {
            return await this.stripe.refunds.retrieve(refundId);
        }, 'getRefund');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Customer Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Create a Stripe customer
     * 
     * @param email - Customer email
     * @param name - Customer name
     * @param metadata - Additional metadata (system customer ID, etc.)
     * @returns Stripe customer
     */
    async createCustomer(
        email: string,
        name: string,
        metadata: PaymentMetadata,
    ): Promise<Stripe.Customer> {
        this.logger.log(`Creating Stripe customer: ${email}`);

        return this.withRetry(async () => {
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata: metadata as Stripe.MetadataParam,
            });

            this.logger.log(`Stripe customer created: ${customer.id}`);
            return customer;
        }, 'createCustomer');
    }

    /**
     * Retrieve a Stripe customer
     */
    async getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
        this.logger.log(`Retrieving Stripe customer: ${customerId}`);

        return this.withRetry(async () => {
            return await this.stripe.customers.retrieve(customerId);
        }, 'getCustomer');
    }

    /**
     * Find Stripe customer by email
     */
    async findCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
        this.logger.log(`Finding Stripe customer by email: ${email}`);

        const customers = await this.stripe.customers.list({
            email,
            limit: 1,
        });

        return customers.data.length > 0 ? customers.data[0] : null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Webhook Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Construct and verify a webhook event
     * 
     * @param payload - Raw request body as Buffer
     * @param signature - Stripe-Signature header
     * @returns Verified Stripe event
     */
    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
        const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

        if (!webhookSecret) {
            this.logger.error('Webhook secret not configured');
            throw new InternalServerErrorException('Webhook secret not configured');
        }

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret,
            );

            this.logger.log(`Webhook event verified: ${event.type}, id: ${event.id}`);
            return event;
        } catch (error) {
            this.logger.error(`Webhook signature verification failed: ${(error as Error).message}`);
            throw new BadRequestException('Webhook signature verification failed');
        }
    }

    /**
     * Get relevant data from webhook event
     */
    extractPaymentIntentFromEvent(event: Stripe.Event): Stripe.PaymentIntent | null {
        if (event.type.startsWith('payment_intent.')) {
            return event.data.object as Stripe.PaymentIntent;
        }
        return null;
    }

    /**
     * Get checkout session from webhook event
     */
    extractCheckoutSessionFromEvent(event: Stripe.Event): Stripe.Checkout.Session | null {
        if (event.type.startsWith('checkout.session.')) {
            return event.data.object as Stripe.Checkout.Session;
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Utility Methods
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Get the publishable key for frontend use
     */
    getPublishableKey(): string {
        const key = this.configService.get<string>('stripe.publishableKey');
        if (!key) {
            throw new InternalServerErrorException('Stripe publishable key not configured');
        }
        return key;
    }

    /**
     * Test Stripe connection
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.stripe.balance.retrieve();
            this.logger.log('Stripe connection test successful');
            return true;
        } catch (error) {
            this.logger.error(`Stripe connection test failed: ${(error as Error).message}`);
            return false;
        }
    }
}
