import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ServiceConnection,
  ConnectionStatus,
} from '../../database/entities/service-connection.entity';

/**
 * DTO for connection address response
 */
export class ConnectionAddressResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  connectionAddressId: number;

  @ApiProperty({ example: '123 Main Street' })
  @Expose()
  line1: string;

  @ApiProperty({ example: 'Colombo' })
  @Expose()
  city: string;

  @ApiProperty({ example: '00100' })
  @Expose()
  postalCode: string;

  @ApiProperty({ example: 1 })
  @Expose()
  geoAreaId: number;

  @ApiPropertyOptional({ example: 'Colombo District' })
  @Expose()
  geoAreaName?: string;
}

/**
 * DTO for utility type in response
 */
export class UtilityTypeResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  utilityTypeId: number;

  @ApiProperty({ example: 'ELEC' })
  @Expose()
  code: string;

  @ApiProperty({ example: 'Electricity' })
  @Expose()
  name: string;
}

/**
 * DTO for tariff category in response
 */
export class TariffCategoryResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  tariffCategoryId: number;

  @ApiProperty({ example: 'RES-STD' })
  @Expose()
  code: string;

  @ApiProperty({ example: 'Residential Standard' })
  @Expose()
  name: string;

  @ApiProperty({ example: false })
  @Expose()
  isSubsidized: boolean;
}

/**
 * DTO for meter in response
 */
export class MeterResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  meterId: number;

  @ApiProperty({ example: 'MTR-2024-001234' })
  @Expose()
  meterSerialNo: string;

  @ApiProperty({ example: true })
  @Expose()
  isSmartMeter: boolean;

  @ApiProperty({ example: 'ACTIVE' })
  @Expose()
  status: string;
}

/**
 * DTO for customer info in connection response
 */
export class CustomerInfoResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  customerId: number;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: 'RESIDENTIAL' })
  @Expose()
  customerType: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @Expose()
  email?: string;
}

/**
 * DTO for service connection response
 */
export class ConnectionResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  connectionId: number;

  @ApiProperty({ example: 1 })
  @Expose()
  customerId: number;

  @ApiProperty({ example: 1 })
  @Expose()
  utilityTypeId: number;

  @ApiProperty({ example: 1 })
  @Expose()
  tariffCategoryId: number;

  @ApiProperty({ enum: ConnectionStatus, example: ConnectionStatus.ACTIVE })
  @Expose()
  connectionStatus: ConnectionStatus;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  meterId: number | null;

  @ApiProperty({ example: 1 })
  @Expose()
  connectionAddressId: number;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  nodeId: number | null;

  // Populated related data
  @ApiProperty({ type: CustomerInfoResponseDto })
  @Expose()
  @Type(() => CustomerInfoResponseDto)
  customer: CustomerInfoResponseDto;

  @ApiProperty({ type: UtilityTypeResponseDto })
  @Expose()
  @Type(() => UtilityTypeResponseDto)
  utilityType: UtilityTypeResponseDto;

  @ApiProperty({ type: TariffCategoryResponseDto })
  @Expose()
  @Type(() => TariffCategoryResponseDto)
  tariffCategory: TariffCategoryResponseDto;

  @ApiPropertyOptional({ type: MeterResponseDto })
  @Expose()
  @Type(() => MeterResponseDto)
  meter: MeterResponseDto | null;

  @ApiProperty({ type: ConnectionAddressResponseDto })
  @Expose()
  @Type(() => ConnectionAddressResponseDto)
  connectionAddress: ConnectionAddressResponseDto;

  /**
   * Create response DTO from ServiceConnection entity
   */
  static fromEntity(connection: ServiceConnection): ConnectionResponseDto {
    const dto = new ConnectionResponseDto();

    dto.connectionId = connection.connectionId;
    dto.customerId = connection.customerId;
    dto.utilityTypeId = connection.utilityTypeId;
    dto.tariffCategoryId = connection.tariffCategoryId;
    dto.connectionStatus = connection.connectionStatus;
    dto.meterId = connection.meterId;
    dto.connectionAddressId = connection.connectionAddressId;
    dto.nodeId = connection.nodeId;

    // Populate customer info
    if (connection.customer) {
      dto.customer = {
        customerId: connection.customer.customerId,
        fullName: connection.customer.fullName,
        customerType: connection.customer.customerType,
        email: connection.customer.email || undefined,
      };
    }

    // Populate utility type
    if (connection.utilityType) {
      dto.utilityType = {
        utilityTypeId: connection.utilityType.utilityTypeId,
        code: connection.utilityType.code,
        name: connection.utilityType.name,
      };
    }

    // Populate tariff category
    if (connection.tariffCategory) {
      dto.tariffCategory = {
        tariffCategoryId: connection.tariffCategory.tariffCategoryId,
        code: connection.tariffCategory.code,
        name: connection.tariffCategory.name,
        isSubsidized: connection.tariffCategory.isSubsidized,
      };
    }

    // Populate meter (if assigned)
    if (connection.meter) {
      dto.meter = {
        meterId: connection.meter.meterId,
        meterSerialNo: connection.meter.meterSerialNo,
        isSmartMeter: connection.meter.isSmartMeter,
        status: connection.meter.status,
      };
    } else {
      dto.meter = null;
    }

    // Populate connection address
    if (connection.connectionAddress) {
      dto.connectionAddress = {
        connectionAddressId: connection.connectionAddress.connectionAddressId,
        line1: connection.connectionAddress.line1,
        city: connection.connectionAddress.city,
        postalCode: connection.connectionAddress.postalCode,
        geoAreaId: connection.connectionAddress.geoAreaId,
        geoAreaName: connection.connectionAddress.geoArea?.name,
      };
    }

    return dto;
  }

  /**
   * Create array of response DTOs from entities
   */
  static fromEntities(connections: ServiceConnection[]): ConnectionResponseDto[] {
    return connections.map((connection) => this.fromEntity(connection));
  }
}
