import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerApiController } from './customer-api.controller';
import { PaymentService } from '../payments/payment.service';
import { BillingService } from '../billing/billing.service';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import {
  Payment,
  Bill,
  BillDetail,
  BillTax,
  Customer,
  Employee,
  Meter,
  MeterReading,
  TariffSlab,
  TaxConfig,
  ServiceConnection,
  ConnectionAddress,
} from '../database/entities';
import { StripeModule } from '../stripe/stripe.module';

/**
 * Customer API Module
 * Handles customer-facing endpoints for bills, payments, and dashboard
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Bill,
      BillDetail,
      BillTax,
      Customer,
      Employee,
      Meter,
      MeterReading,
      TariffSlab,
      TaxConfig,
      ServiceConnection,
      ConnectionAddress,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
    StripeModule,
  ],
  controllers: [CustomerApiController],
  providers: [PaymentService, BillingService, CustomerJwtGuard],
  exports: [CustomerJwtGuard],
})
export class CustomerApiModule {}
