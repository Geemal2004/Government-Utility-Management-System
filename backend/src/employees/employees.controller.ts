import { Controller, Get, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';

@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of employees retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseDto<{ data: EmployeeResponseDto[]; total: number; page: number; limit: number }>> {
    const result = await this.employeesService.findAll(page, limit);
    return {
      success: true,
      data: {
        data: result.data.map((emp) => EmployeeResponseDto.fromEntity(emp)),
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
      message: 'Employees retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee found' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.employeesService.findByIdOrFail(id);
    return {
      success: true,
      data: EmployeeResponseDto.fromEntity(employee),
      message: 'Employee retrieved successfully',
    };
  }
}
