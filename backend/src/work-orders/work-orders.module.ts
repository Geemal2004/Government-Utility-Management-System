import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrder } from '../database/entities/work-order.entity';
import { WorkOrderLabor } from '../database/entities/work-order-labor.entity';
import { WorkOrderItemUsage } from '../database/entities/work-order-item-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, WorkOrderLabor, WorkOrderItemUsage])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
