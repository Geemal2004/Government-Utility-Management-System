import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
    HttpStatus,
    Logger,
    RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { StripeService } from '../stripe/stripe.service';
import { PaymentService } from '../payments/payment.service';
import { StripeWebhookEventDto, StripeWebhookEventType } from '../payments/dto';
import Stripe from 'stripe';

/**
 * Stripe Webhook Controller
 * 
 * Handles incoming webhook events from Stripe for payment processing.
 * This endpoint does NOT use JWT authentication - it verifies requests
 * using Stripe's signature verification instead.
 * 
 * CRITICAL: Must respond within 300ms or Stripe will retry the request.
 * Heavy operations (emails, etc.) should be processed asynchronously.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
    private readonly logger = new Logger(StripeWebhookController.name);

    /**
     * Set of processed event IDs for idempotency
     * In production, this should be stored in Redis or database
     */
    private readonly processedEvents = new Set<string>();

    constructor(
        private readonly stripeService: StripeService,
        private readonly paymentService: PaymentService,
    ) { }

    /**
     * Handle incoming Stripe webhook events
     * 
     * @param req - Raw request with body as Buffer
     * @param res - Response object for immediate acknowledgment
     * @param signature - Stripe signature header
     * @returns { received: true } on success
     */
    @Post('stripe')
    @ApiOperation({
        summary: 'Stripe webhook endpoint',
        description: 'Receives and processes webhook events from Stripe. No authentication required - uses Stripe signature verification.',
    })
    @ApiHeader({
        name: 'stripe-signature',
        description: 'Stripe webhook signature for verification',
        required: true,
    })
    @ApiExcludeEndpoint() // Hide from Swagger UI for security
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string,
    ): Promise<void> {
        const startTime = Date.now();

        // Step a) Get raw body
        const rawBody = req.rawBody;

        if (!rawBody) {
            this.logger.error('No raw body available in request');
            res.status(HttpStatus.BAD_REQUEST).json({ error: 'No request body' });
            return;
        }

        if (!signature) {
            this.logger.error('No stripe-signature header present');
            res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing signature' });
            return;
        }

        let event: Stripe.Event;

        try {
            // Step b,c) Verify signature and construct event
            event = this.stripeService.constructWebhookEvent(rawBody, signature);
            this.logger.log(`Received webhook event: ${event.type}, ID: ${event.id}`);
        } catch (error) {
            this.logger.error(`Webhook signature verification failed: ${(error as Error).message}`);
            res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid signature' });
            return;
        }

        // Step d) Check idempotency - don't process same event twice
        if (this.processedEvents.has(event.id)) {
            this.logger.warn(`Event ${event.id} already processed, skipping`);
            res.status(HttpStatus.OK).json({ received: true, duplicate: true });
            return;
        }

        // Mark as processing (add to set immediately)
        this.processedEvents.add(event.id);

        // Clean up old events (keep last 1000)
        if (this.processedEvents.size > 1000) {
            const iterator = this.processedEvents.values();
            for (let i = 0; i < 100; i++) {
                this.processedEvents.delete(iterator.next().value as string);
            }
        }

        // Step g) Respond immediately to Stripe (within 300ms target)
        res.status(HttpStatus.OK).json({ received: true });

        // Step e,f) Process event asynchronously after responding
        this.processEventAsync(event).catch(error => {
            this.logger.error(`Async event processing failed for ${event.id}:`, error);
        });

        const elapsed = Date.now() - startTime;
        this.logger.log(`Webhook response sent in ${elapsed}ms`);
    }

    /**
     * Process webhook event asynchronously
     * This runs after the HTTP response has been sent to Stripe
     */
    private async processEventAsync(event: Stripe.Event): Promise<void> {
        this.logger.log(`Processing event ${event.type} asynchronously`);

        try {
            // Step e) Route to appropriate handler
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event);
                    break;

                case 'charge.refunded':
                    await this.handleChargeRefunded(event);
                    break;

                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event);
                    break;

                case 'checkout.session.expired':
                    await this.handleCheckoutSessionExpired(event);
                    break;

                default:
                    this.logger.debug(`Unhandled event type: ${event.type}`);
            }

            this.logger.log(`Event ${event.id} processed successfully`);
        } catch (error) {
            // Log error but don't throw - event already acknowledged
            this.logger.error(`Error processing event ${event.id}:`, error);
            // Could add to dead-letter queue for retry
        }
    }

    /**
     * Handle payment_intent.succeeded event
     * Called when a payment is successfully completed
     */
    private async handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        this.logger.log(`Payment succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);

        const eventDto: StripeWebhookEventDto = {
            eventId: event.id,
            eventType: StripeWebhookEventType.PAYMENT_INTENT_SUCCEEDED,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            chargeId: paymentIntent.latest_charge as string || undefined,
            metadata: paymentIntent.metadata as Record<string, string>,
        };

        await this.paymentService.handleStripeWebhook(eventDto);

        // Async: Send confirmation email (don't await)
        this.sendPaymentConfirmationEmail(paymentIntent).catch(err => {
            this.logger.warn(`Failed to send confirmation email: ${err.message}`);
        });
    }

    /**
     * Handle payment_intent.payment_failed event
     * Called when a payment attempt fails
     */
    private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        this.logger.warn(`Payment failed: ${paymentIntent.id}`);

        const eventDto: StripeWebhookEventDto = {
            eventId: event.id,
            eventType: StripeWebhookEventType.PAYMENT_INTENT_FAILED,
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata as Record<string, string>,
        };

        await this.paymentService.handleStripeWebhook(eventDto);

        // Async: Notify customer of failure
        this.sendPaymentFailureNotification(paymentIntent).catch(err => {
            this.logger.warn(`Failed to send failure notification: ${err.message}`);
        });
    }

    /**
     * Handle charge.refunded event
     * Called when a charge is refunded (full or partial)
     */
    private async handleChargeRefunded(event: Stripe.Event): Promise<void> {
        const charge = event.data.object as Stripe.Charge;

        this.logger.log(`Charge refunded: ${charge.id}, amount_refunded: ${charge.amount_refunded}`);

        const eventDto: StripeWebhookEventDto = {
            eventId: event.id,
            eventType: StripeWebhookEventType.CHARGE_REFUNDED,
            paymentIntentId: charge.payment_intent as string || undefined,
            chargeId: charge.id,
            status: charge.status,
            amount: charge.amount_refunded,
            currency: charge.currency,
            metadata: charge.metadata as Record<string, string>,
        };

        await this.paymentService.handleStripeWebhook(eventDto);

        // Async: Send refund confirmation email
        this.sendRefundConfirmationEmail(charge).catch(err => {
            this.logger.warn(`Failed to send refund confirmation: ${err.message}`);
        });
    }

    /**
     * Handle checkout.session.completed event
     * Called when a Checkout Session is successfully completed
     */
    private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
        const session = event.data.object as Stripe.Checkout.Session;

        this.logger.log(`Checkout completed: ${session.id}, payment_status: ${session.payment_status}`);

        // Only process successful payments
        if (session.payment_status !== 'paid') {
            this.logger.warn(`Checkout session ${session.id} not paid, status: ${session.payment_status}`);
            return;
        }

        const eventDto: StripeWebhookEventDto = {
            eventId: event.id,
            eventType: StripeWebhookEventType.CHECKOUT_SESSION_COMPLETED,
            checkoutSessionId: session.id,
            paymentIntentId: session.payment_intent as string || undefined,
            status: session.payment_status,
            amount: session.amount_total || 0,
            currency: session.currency || 'lkr',
            metadata: session.metadata as Record<string, string>,
        };

        await this.paymentService.handleStripeWebhook(eventDto);

        // Async: Send checkout confirmation email
        this.sendCheckoutConfirmationEmail(session).catch(err => {
            this.logger.warn(`Failed to send checkout confirmation: ${err.message}`);
        });
    }

    /**
     * Handle checkout.session.expired event
     * Called when a Checkout Session expires without completion
     */
    private async handleCheckoutSessionExpired(event: Stripe.Event): Promise<void> {
        const session = event.data.object as Stripe.Checkout.Session;

        this.logger.log(`Checkout expired: ${session.id}`);

        const eventDto: StripeWebhookEventDto = {
            eventId: event.id,
            eventType: StripeWebhookEventType.CHECKOUT_SESSION_EXPIRED,
            checkoutSessionId: session.id,
            status: 'expired',
            amount: session.amount_total || 0,
            currency: session.currency || 'lkr',
            metadata: session.metadata as Record<string, string>,
        };

        await this.paymentService.handleStripeWebhook(eventDto);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Async Email Methods (fire-and-forget, don't block webhook processing)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Send payment confirmation email (async, non-blocking)
     */
    private async sendPaymentConfirmationEmail(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        // TODO: Implement email service integration
        const customerEmail = paymentIntent.metadata?.customerEmail;
        if (customerEmail) {
            this.logger.log(`Would send confirmation email to ${customerEmail} for payment ${paymentIntent.id}`);
            // await this.emailService.sendPaymentConfirmation(customerEmail, paymentIntent);
        }
    }

    /**
     * Send payment failure notification (async, non-blocking)
     */
    private async sendPaymentFailureNotification(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        // TODO: Implement email service integration
        const customerEmail = paymentIntent.metadata?.customerEmail;
        if (customerEmail) {
            this.logger.log(`Would send failure notification to ${customerEmail} for payment ${paymentIntent.id}`);
            // await this.emailService.sendPaymentFailure(customerEmail, paymentIntent);
        }
    }

    /**
     * Send refund confirmation email (async, non-blocking)
     */
    private async sendRefundConfirmationEmail(charge: Stripe.Charge): Promise<void> {
        // TODO: Implement email service integration
        const customerEmail = charge.metadata?.customerEmail || charge.billing_details?.email;
        if (customerEmail) {
            this.logger.log(`Would send refund confirmation to ${customerEmail} for charge ${charge.id}`);
            // await this.emailService.sendRefundConfirmation(customerEmail, charge);
        }
    }

    /**
     * Send checkout confirmation email (async, non-blocking)
     */
    private async sendCheckoutConfirmationEmail(session: Stripe.Checkout.Session): Promise<void> {
        // TODO: Implement email service integration
        const customerEmail = session.customer_email || session.metadata?.customerEmail;
        if (customerEmail) {
            this.logger.log(`Would send checkout confirmation to ${customerEmail} for session ${session.id}`);
            // await this.emailService.sendCheckoutConfirmation(customerEmail, session);
        }
    }
}
