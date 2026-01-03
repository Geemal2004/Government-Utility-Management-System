import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateConnectionDto } from './create-connection.dto';
import { ConnectionStatus } from '../../database/entities/service-connection.entity';

/**
 * DTO for updating an existing service connection
 * All fields from CreateConnectionDto are optional
 */
export class UpdateConnectionDto extends PartialType(CreateConnectionDto) {
  @ApiPropertyOptional({
    description: 'Connection status',
    enum: ConnectionStatus,
    example: ConnectionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ConnectionStatus, {
    message: `Connection status must be one of: ${Object.values(ConnectionStatus).join(', ')}`,
  })
  connectionStatus?: ConnectionStatus;
}
