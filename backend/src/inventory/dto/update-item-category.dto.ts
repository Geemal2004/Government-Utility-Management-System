import { PartialType } from '@nestjs/swagger';
import { CreateItemCategoryDto } from './create-item-category.dto';

/**
 * DTO for updating an item category
 */
export class UpdateItemCategoryDto extends PartialType(CreateItemCategoryDto) {}
