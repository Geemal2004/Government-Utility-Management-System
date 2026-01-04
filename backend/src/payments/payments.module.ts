import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from '../database/entities/payment.entity';
import { Bill } from '../database/entities/bill.entity';
import { Customer } from '../database/entities/customer.entity';
import { Employee } from '../database/entities/employee.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { StripeModule } from '../stripe/stripe.module';

/**
 * Payments Module
 *
 * Handles all payment-related functionality including:
 * - Recording payments (cashier and online)
 * - Stripe integration for online payments
 * - Payment history and reporting
 * - Refund processing
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Bill, Customer, Employee]),
    StripeModule,
    ConfigModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentsModule {}
