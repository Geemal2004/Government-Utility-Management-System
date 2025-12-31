import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { ServiceConnection } from '../database/entities/service-connection.entity';
import { ConnectionAddress } from '../database/entities/connection-address.entity';
import { Meter } from '../database/entities/meter.entity';
import { UtilityType } from '../database/entities/utility-type.entity';
import { TariffCategory } from '../database/entities/tariff-category.entity';
import { Customer } from '../database/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceConnection,
      ConnectionAddress,
      Meter,
      UtilityType,
      TariffCategory,
      Customer,
    ]),
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
