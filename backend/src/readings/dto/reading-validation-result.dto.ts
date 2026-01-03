import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for reading validation results
 * Used when validating readings before bulk import
 */
export class ReadingValidationResultDto {
  @ApiProperty({
    description: 'Whether the reading passed all validation checks',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'List of validation errors (blocking issues)',
    example: ['Import reading cannot be less than previous reading'],
    type: [String],
  })
  errors: string[];

  @ApiProperty({
    description: 'List of warnings (non-blocking issues)',
    example: ['Consumption unusually high compared to previous month'],
    type: [String],
  })
  warnings: string[];

  @ApiProperty({
    description: 'Index of the reading in the batch (if bulk validation)',
    example: 0,
  })
  index?: number;

  @ApiProperty({
    description: 'Meter ID for reference',
    example: 1,
  })
  meterId?: number;

  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Add an error and mark as invalid
   */
  addError(message: string): void {
    this.errors.push(message);
    this.isValid = false;
  }

  /**
   * Add a warning (doesn't affect validity)
   */
  addWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * Check if there are any warnings
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}

/**
 * DTO for bulk validation results
 */
export class BulkValidationResultDto {
  @ApiProperty({
    description: 'Whether all readings passed validation',
    example: true,
  })
  allValid: boolean;

  @ApiProperty({
    description: 'Total number of readings validated',
    example: 10,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Number of valid readings',
    example: 8,
  })
  validCount: number;

  @ApiProperty({
    description: 'Number of invalid readings',
    example: 2,
  })
  invalidCount: number;

  @ApiProperty({
    description: 'Number of readings with warnings',
    example: 3,
  })
  warningCount: number;

  @ApiProperty({
    description: 'Individual validation results',
    type: [ReadingValidationResultDto],
  })
  results: ReadingValidationResultDto[];

  constructor() {
    this.allValid = true;
    this.totalCount = 0;
    this.validCount = 0;
    this.invalidCount = 0;
    this.warningCount = 0;
    this.results = [];
  }

  /**
   * Add a validation result
   */
  addResult(result: ReadingValidationResultDto): void {
    this.results.push(result);
    this.totalCount++;

    if (result.isValid) {
      this.validCount++;
    } else {
      this.invalidCount++;
      this.allValid = false;
    }

    if (result.hasWarnings()) {
      this.warningCount++;
    }
  }
}
