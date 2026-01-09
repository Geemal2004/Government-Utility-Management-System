import { IsNotEmpty, IsString, IsEnum, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @ApiProperty({ description: 'Complaint type', example: 'BILLING_ISSUE' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  complaintType: string;

  @ApiProperty({ description: 'Complaint description', example: 'Incorrect bill amount' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description: string;
}
