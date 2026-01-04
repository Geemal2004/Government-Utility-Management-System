import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeModule } from '../stripe/stripe.module';
import { PaymentsModule } from '../payments/payments.module';

/**
 * Webhooks Module
 *
 * Handles external webhook endpoints (Stripe, etc.)
 * These endpoints are typically unauthenticated and use signature verification.
 */
@Module({
  imports: [StripeModule, PaymentsModule],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}
