import { PartialType } from '@nestjs/swagger';
import { CreateWarehouseDto } from './create-warehouse.dto';

/**
 * DTO for updating a warehouse
 */
export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
