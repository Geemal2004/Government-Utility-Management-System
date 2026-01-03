import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingEventListener } from './billing-event.listener';
import {
  Bill,
  BillDetail,
  BillTax,
  TariffSlab,
  TariffCategory,
  TaxConfig,
  Meter,
  MeterReading,
  ServiceConnection,
  Customer,
} from '../database/entities';

/**
 * BillingModule
 * Handles bill generation, calculation, and management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bill,
      BillDetail,
      BillTax,
      TariffSlab,
      TariffCategory,
      TaxConfig,
      Meter,
      MeterReading,
      ServiceConnection,
      Customer,
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingEventListener],
  exports: [BillingService],
})
export class BillingModule {}
