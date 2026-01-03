import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';
import { UtilityType } from '../database/entities/utility-type.entity';
import { TariffCategory } from '../database/entities/tariff-category.entity';
import { Meter } from '../database/entities/meter.entity';
import { GeoArea } from '../database/entities/geo-area.entity';
import { NetworkNode } from '../database/entities/network-node.entity';
import { Customer } from '../database/entities/customer.entity';
import { ServiceConnection } from '../database/entities/service-connection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UtilityType,
      TariffCategory,
      Meter,
      GeoArea,
      NetworkNode,
      Customer,
      ServiceConnection,
    ]),
  ],
  controllers: [LookupController],
  providers: [LookupService],
  exports: [LookupService],
})
export class LookupModule {}
