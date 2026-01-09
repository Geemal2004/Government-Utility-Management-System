import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollRun } from '../database/entities/payroll-run.entity';
import { Payslip } from '../database/entities/payslip.entity';
import { PayslipComponent } from '../database/entities/payslip-component.entity';
import { SalaryComponentType } from '../database/entities/salary-component-type.entity';
import { Employee } from '../database/entities/employee.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            PayrollRun,
            Payslip,
            PayslipComponent,
            SalaryComponentType,
            Employee,
        ]),
    ],
    controllers: [PayrollController],
    providers: [PayrollService],
    exports: [PayrollService],
})
export class PayrollModule { }
