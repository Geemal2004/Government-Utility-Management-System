import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterReading } from '../database/entities/meter-reading.entity';
import { Meter } from '../database/entities/meter.entity';
import { MeterReader } from '../database/entities/meter-reader.entity';
import { Employee } from '../database/entities/employee.entity';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';

@Module({
  imports: [TypeOrmModule.forFeature([MeterReading, Meter, MeterReader, Employee])],
  controllers: [ReadingsController],
  providers: [ReadingsService],
  exports: [ReadingsService],
})
export class ReadingsModule {}
