import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { Department } from '../database/entities/department.entity';
import { Employee } from '../database/entities/employee.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Department, Employee])],
    controllers: [DepartmentController],
    providers: [DepartmentService],
    exports: [DepartmentService],
})
export class DepartmentModule { }
