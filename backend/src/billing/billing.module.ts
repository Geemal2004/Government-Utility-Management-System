import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
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
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
