import { ApiProperty } from '@nestjs/swagger';

/**
 * Period information for consumption summary
 */
export class PeriodDto {
  @ApiProperty({
    description: 'Start date of the period',
    example: '2025-01-01T00:00:00.000Z',
  })
  start: string;

  @ApiProperty({
    description: 'End date of the period',
    example: '2025-12-31T23:59:59.000Z',
  })
  end: string;
}

/**
 * DTO for consumption summary statistics
 * Aggregates readings for a meter over a period
 */
export class ConsumptionSummaryDto {
  @ApiProperty({
    description: 'Meter ID',
    example: 1,
  })
  meterId: number;

  @ApiProperty({
    description: 'Meter serial number',
    example: 'MTR-001-2024',
  })
  meterSerialNo: string;

  @ApiProperty({
    description: 'Utility type name',
    example: 'Electricity',
  })
  utilityTypeName: string;

  @ApiProperty({
    description: 'Period covered by the summary',
    type: PeriodDto,
  })
  period: PeriodDto;

  @ApiProperty({
    description: 'Total consumption for the period',
    example: 1250.5,
  })
  totalConsumption: number;

  @ApiProperty({
    description: 'Total energy exported (for net metering)',
    example: 150.25,
  })
  totalExported: number;

  @ApiProperty({
    description: 'Net consumption (total consumed - total exported)',
    example: 1100.25,
  })
  netConsumption: number;

  @ApiProperty({
    description: 'Number of readings in the period',
    example: 12,
  })
  readingCount: number;

  @ApiProperty({
    description: 'Average consumption per reading',
    example: 104.21,
  })
  averageConsumption: number;

  @ApiProperty({
    description: 'Highest single consumption',
    example: 180.5,
  })
  maxConsumption: number;

  @ApiProperty({
    description: 'Lowest single consumption',
    example: 45.25,
  })
  minConsumption: number;

  @ApiProperty({
    description: 'First reading value in the period',
    example: 10000.0,
  })
  firstReading: number;

  @ApiProperty({
    description: 'Last reading value in the period',
    example: 11250.5,
  })
  lastReading: number;

  @ApiProperty({
    description: 'Estimated monthly average',
    example: 312.63,
  })
  estimatedMonthlyAverage: number;

  constructor() {
    this.totalConsumption = 0;
    this.totalExported = 0;
    this.netConsumption = 0;
    this.readingCount = 0;
    this.averageConsumption = 0;
    this.maxConsumption = 0;
    this.minConsumption = 0;
    this.firstReading = 0;
    this.lastReading = 0;
    this.estimatedMonthlyAverage = 0;
  }

  /**
   * Calculate derived fields
   */
  calculate(): void {
    this.netConsumption = this.totalConsumption - this.totalExported;

    if (this.readingCount > 0) {
      this.averageConsumption = Number((this.totalConsumption / this.readingCount).toFixed(2));
    }

    // Estimate monthly average based on period
    if (this.period?.start && this.period?.end) {
      const startDate = new Date(this.period.start);
      const endDate = new Date(this.period.end);
      const daysDiff = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      );
      const monthsDiff = daysDiff / 30;
      this.estimatedMonthlyAverage = Number((this.totalConsumption / monthsDiff).toFixed(2));
    }
  }
}

/**
 * DTO for multiple meters consumption comparison
 */
export class ConsumptionComparisonDto {
  @ApiProperty({
    description: 'Period for comparison',
    type: PeriodDto,
  })
  period: PeriodDto;

  @ApiProperty({
    description: 'Consumption summaries for each meter',
    type: [ConsumptionSummaryDto],
  })
  meters: ConsumptionSummaryDto[];

  @ApiProperty({
    description: 'Total consumption across all meters',
    example: 5000.0,
  })
  totalConsumptionAllMeters: number;

  @ApiProperty({
    description: 'Total exported across all meters',
    example: 500.0,
  })
  totalExportedAllMeters: number;

  @ApiProperty({
    description: 'Total number of readings across all meters',
    example: 48,
  })
  totalReadingCount: number;
}
