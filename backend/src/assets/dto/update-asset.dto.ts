import { PartialType } from '@nestjs/swagger';
import { CreateAssetDto } from './create-asset.dto';

/**
 * DTO for updating an asset
 * All fields are optional (inherited from CreateAssetDto)
 */
export class UpdateAssetDto extends PartialType(CreateAssetDto) {}
