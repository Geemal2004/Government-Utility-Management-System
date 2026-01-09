import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiParam,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiConflictResponse,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiBadRequestResponse,
} from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
    CreateDepartmentDto,
    UpdateDepartmentDto,
    DepartmentResponseDto,
    DepartmentWithEmployeesDto,
} from './dto';
import { EmployeeResponseDto } from '../employees/dto/employee-response.dto';

/**
 * Controller for department operations
 * Handles CRUD operations for departments
 */
@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    /**
     * POST /departments
     * Create new department
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create department' })
    @ApiCreatedResponse({
        description: 'Department created successfully',
        type: DepartmentResponseDto,
    })
    @ApiConflictResponse({ description: 'Department name already exists' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
    async create(
        @Body() createDto: CreateDepartmentDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<DepartmentResponseDto> {
        return this.departmentService.create(createDto, currentUser.employeeId);
    }

    /**
     * GET /departments
     * Get all departments with utility type info and employee count
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all departments' })
    @ApiOkResponse({
        description: 'Departments retrieved successfully',
        type: [DepartmentResponseDto],
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async findAll(): Promise<DepartmentResponseDto[]> {
        return this.departmentService.findAllWithStats();
    }

    /**
     * GET /departments/:id
     * Get department details with employees
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get department by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'Department ID' })
    @ApiOkResponse({
        description: 'Department found',
        type: DepartmentWithEmployeesDto,
    })
    @ApiNotFoundResponse({ description: 'Department not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<DepartmentWithEmployeesDto> {
        return this.departmentService.findByIdWithEmployees(id);
    }

    /**
     * PUT /departments/:id
     * Update department
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update department' })
    @ApiParam({ name: 'id', type: Number, description: 'Department ID' })
    @ApiOkResponse({
        description: 'Department updated successfully',
        type: DepartmentResponseDto,
    })
    @ApiNotFoundResponse({ description: 'Department not found' })
    @ApiConflictResponse({ description: 'Department name already exists' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateDepartmentDto,
        @CurrentUser() currentUser: { employeeId: number; role: string },
    ): Promise<DepartmentResponseDto> {
        return this.departmentService.update(id, updateDto, currentUser.employeeId);
    }

    /**
     * DELETE /departments/:id
     * Delete department (fails if employees exist)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete department' })
    @ApiParam({ name: 'id', type: Number, description: 'Department ID' })
    @ApiOkResponse({
        description: 'Department deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Department deleted successfully' },
            },
        },
    })
    @ApiBadRequestResponse({ description: 'Cannot delete department with assigned employees' })
    @ApiNotFoundResponse({ description: 'Department not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
    async delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
        await this.departmentService.delete(id);
        return { message: 'Department deleted successfully' };
    }

    /**
     * GET /departments/:id/employees
     * Get employees in department
     */
    @Get(':id/employees')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get department employees' })
    @ApiParam({ name: 'id', type: Number, description: 'Department ID' })
    @ApiOkResponse({
        description: 'Department employees retrieved successfully',
        type: [EmployeeResponseDto],
    })
    @ApiNotFoundResponse({ description: 'Department not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async findEmployees(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<EmployeeResponseDto[]> {
        return this.departmentService.findEmployeesByDepartment(id);
    }
}
