import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';
import stripeConfig from '../config/stripe.config';

/**
 * Stripe Module
 * Provides Stripe instance and StripeService as global singletons
 *
 * Usage:
 * 1. Import StripeModule in AppModule
 * 2. Inject StripeService in any service/controller
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(stripeConfig)],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService): Stripe => {
        const secretKey = configService.get<string>('stripe.secretKey');
        const apiVersion = configService.get<string>('stripe.apiVersion');

        if (!secretKey) {
          throw new Error('STRIPE_SECRET_KEY is not configured');
        }

        return new Stripe(secretKey, {
          apiVersion: apiVersion as Stripe.LatestApiVersion,
          typescript: true,
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  exports: [StripeService, 'STRIPE_CLIENT'],
})
export class StripeModule implements OnModuleInit {
  private readonly logger = new Logger(StripeModule.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate Stripe configuration on module initialization
   */
  onModuleInit() {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    const publishableKey = this.configService.get<string>('stripe.publishableKey');
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    if (!secretKey) {
      this.logger.error('STRIPE_SECRET_KEY is not configured - Stripe payments will not work');
    } else {
      this.logger.log('Stripe secret key configured');
    }

    if (!publishableKey) {
      this.logger.warn(
        'STRIPE_PUBLISHABLE_KEY is not configured - Frontend Stripe.js may not work',
      );
    }

    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET is not configured - Webhook verification will fail');
    }

    this.logger.log('Stripe module initialized');
  }
}
