import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeterReading } from '../../database/entities/meter-reading.entity';

/**
 * Meter information included in reading response
 */
export class MeterInfoDto {
  @ApiProperty({ example: 1 })
  meterId: number;

  @ApiProperty({ example: 'MTR-001-2024' })
  meterSerialNo: string;

  @ApiProperty({ example: 'Electricity' })
  utilityTypeName: string;

  @ApiProperty({ example: 1 })
  utilityTypeId: number;

  @ApiProperty({ example: true })
  isSmartMeter: boolean;
}

/**
 * Reader information included in reading response
 */
export class ReaderInfoDto {
  @ApiProperty({ example: 1 })
  employeeId: number;

  @ApiProperty({ example: 'John Smith' })
  readerName: string;

  @ApiPropertyOptional({ example: 'DEV-001' })
  deviceId: string | null;
}

/**
 * Response DTO for meter reading
 * Includes computed fields and related entity info
 */
export class MeterReadingResponseDto {
  @ApiProperty({ example: 1 })
  readingId: number;

  @ApiProperty({ example: 1 })
  meterId: number;

  @ApiPropertyOptional({ example: 5 })
  meterReaderId: number | null;

  @ApiProperty({ example: '2025-12-31T10:30:00.000Z' })
  readingDate: string;

  @ApiProperty({ example: 'MANUAL' })
  readingSource: string;

  @ApiPropertyOptional({ example: 12500.5 })
  importReading: number | null;

  @ApiPropertyOptional({ example: 12000.0 })
  prevImportReading: number | null;

  @ApiPropertyOptional({ example: 500.25 })
  exportReading: number | null;

  @ApiPropertyOptional({ example: 450.0 })
  prevExportReading: number | null;

  @ApiPropertyOptional({ example: 'DEV-001' })
  deviceId: string | null;

  @ApiProperty({ example: '2025-12-31T10:30:00.000Z' })
  createdAt: string;

  // Computed fields
  @ApiPropertyOptional({
    description: 'Calculated consumption (importReading - prevImportReading)',
    example: 500.5,
  })
  consumption: number | null;

  @ApiPropertyOptional({
    description: 'Calculated exported energy (exportReading - prevExportReading)',
    example: 50.25,
  })
  exportedEnergy: number | null;

  @ApiPropertyOptional({
    description: 'Net consumption (consumption - exportedEnergy)',
    example: 450.25,
  })
  netConsumption: number | null;

  // Related entity info
  @ApiPropertyOptional({ type: MeterInfoDto })
  meter: MeterInfoDto | null;

  @ApiPropertyOptional({ type: ReaderInfoDto })
  reader: ReaderInfoDto | null;

  /**
   * Create response DTO from entity
   */
  static fromEntity(reading: MeterReading): MeterReadingResponseDto {
    const dto = new MeterReadingResponseDto();

    dto.readingId = reading.readingId;
    dto.meterId = reading.meterId;
    dto.meterReaderId = reading.meterReaderId;
    dto.readingDate = reading.readingDate?.toISOString() || '';
    dto.readingSource = reading.readingSource;
    dto.importReading = reading.importReading ? Number(reading.importReading) : null;
    dto.prevImportReading = reading.prevImportReading ? Number(reading.prevImportReading) : null;
    dto.exportReading = reading.exportReading ? Number(reading.exportReading) : null;
    dto.prevExportReading = reading.prevExportReading ? Number(reading.prevExportReading) : null;
    dto.deviceId = reading.deviceId;
    dto.createdAt = reading.createdAt?.toISOString() || '';

    // Computed fields
    dto.consumption = reading.consumption;
    dto.exportedEnergy = reading.exportedEnergy;
    dto.netConsumption = reading.netConsumption;

    // Related meter info
    if (reading.meter) {
      dto.meter = {
        meterId: reading.meter.meterId,
        meterSerialNo: reading.meter.meterSerialNo,
        utilityTypeName: reading.meter.utilityType?.name || '',
        utilityTypeId: reading.meter.utilityTypeId,
        isSmartMeter: reading.meter.isSmartMeter,
      };
    } else {
      dto.meter = null;
    }

    // Related reader info
    if (reading.meterReader && reading.meterReader.employee) {
      const employee = reading.meterReader.employee;
      dto.reader = {
        employeeId: reading.meterReader.employeeId,
        readerName: `${employee.firstName} ${employee.lastName}`.trim(),
        deviceId: reading.meterReader.deviceId,
      };
    } else {
      dto.reader = null;
    }

    return dto;
  }
}
