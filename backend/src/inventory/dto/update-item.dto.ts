import { PartialType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';

/**
 * DTO for updating an item
 */
export class UpdateItemDto extends PartialType(CreateItemDto) {}
