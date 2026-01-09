import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateProfileDto,
  EmployeeFilterDto,
  ChangePasswordDto,
  DeactivateEmployeeDto,
  AssignRoleDto,
  EmployeeStatsDto,
  Paginated,
} from './dto';

/**
 * Controller for employee operations
 * Handles employee CRUD, role management, and profile operations
 */
@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  // ============================================================
  // FIXED ROUTES (Must be defined BEFORE ':id' to avoid conflicts)
  // ============================================================

  /**
   * GET /employees/statistics
   * Get employee statistics
   */
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get employee statistics' })
  @ApiOkResponse({
    description: 'Employee statistics retrieved successfully',
    type: EmployeeStatsDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStatistics(): Promise<EmployeeStatsDto> {
    return this.employeesService.statistics();
  }

  /**
   * GET /employees/me
   * Get current employee profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current employee profile' })
  @ApiOkResponse({
    description: 'Current employee profile retrieved successfully',
    type: EmployeeResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyProfile(
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.me(currentUser);
  }

  /**
   * PUT /employees/me/profile
   * Update own profile (limited fields)
   */
  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update own profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: EmployeeResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async updateMyProfile(
    @CurrentUser() currentUser: { employeeId: number; role: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.updateMyProfile(currentUser, updateProfileDto);
  }

  /**
   * GET /employees/employee-no/:employeeNo
   * Get employee by employee number
   */
  @Get('employee-no/:employeeNo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get employee by employee number' })
  @ApiParam({ name: 'employeeNo', type: String, description: 'Employee number' })
  @ApiOkResponse({
    description: 'Employee found',
    type: EmployeeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findByEmployeeNo(
    @Param('employeeNo') employeeNo: string,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.findByEmployeeNo(employeeNo);
  }

  /**
   * GET /employees/department/:departmentId
   * Get employees by department
   */
  @Get('department/:departmentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get employees by department' })
  @ApiParam({ name: 'departmentId', type: String, description: 'Department ID' })
  @ApiOkResponse({
    description: 'Employees in department retrieved successfully',
    type: [EmployeeResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findByDepartment(
    @Param('departmentId') departmentId: string,
  ): Promise<EmployeeResponseDto[]> {
    return this.employeesService.findByDepartment(departmentId);
  }

  /**
   * GET /employees/role/:role
   * Get employees by role
   */
  @Get('role/:role')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get employees by role' })
  @ApiParam({
    name: 'role',
    type: String,
    description: 'Role name (ADMIN, MANAGER, CASHIER, METER_READER, FIELD_OFFICER)',
  })
  @ApiOkResponse({
    description: 'Employees with role retrieved successfully',
    type: [EmployeeResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findByRole(@Param('role') role: string): Promise<EmployeeResponseDto[]> {
    return this.employeesService.findByRole(role);
  }

  // ============================================================
  // STANDARD CRUD ROUTES
  // ============================================================

  /**
   * POST /employees
   * Register new employee
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new employee' })
  @ApiCreatedResponse({
    description: 'Employee created successfully',
    type: EmployeeResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - insufficient permissions' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.create(
      createEmployeeDto,
      currentUser.employeeId.toString(),
    );
  }

  /**
   * GET /employees
   * Get all employees with filters and pagination
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all employees' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number, description: 'Filter by department ID' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email, or username' })
  @ApiOkResponse({
    description: 'Employees retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/EmployeeResponseDto' } },
        total: { type: 'number', example: 150 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query() filterDto: EmployeeFilterDto,
  ): Promise<Paginated<EmployeeResponseDto>> {
    return this.employeesService.findAll(filterDto);
  }

  /**
   * GET /employees/:id
   * Get employee by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Employee found',
    type: EmployeeResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<EmployeeResponseDto> {
    return this.employeesService.findById(id);
  }

  /**
   * PUT /employees/:id
   * Update employee details
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update employee' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Employee updated successfully',
    type: EmployeeResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - insufficient permissions' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.update(id, updateEmployeeDto, currentUser);
  }

  /**
   * PATCH /employees/:id/password
   * Change employee password
   */
  @Patch(':id/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change password' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden - can only change own password unless ADMIN' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Invalid old password or validation error' })
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<{ message: string }> {
    await this.employeesService.changePassword(id, changePasswordDto, currentUser);
    return { message: 'Password changed successfully' };
  }

  /**
   * POST /employees/:id/reset-password
   * Admin resets employee password
   */
  @Post(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reset employee password' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        temporaryPassword: { type: 'string', example: 'TempPass123!' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<{ temporaryPassword: string }> {
    return this.employeesService.resetPassword(id, currentUser);
  }

  /**
   * POST /employees/:id/deactivate
   * Deactivate employee (soft delete)
   */
  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate employee' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Employee deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Employee deactivated successfully' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deactivate(
    @Param('id') id: string,
    @Body() deactivateDto: DeactivateEmployeeDto,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<{ message: string }> {
    await this.employeesService.deactivate(id, deactivateDto, currentUser);
    return { message: 'Employee deactivated successfully' };
  }

  /**
   * POST /employees/:id/reactivate
   * Reactivate employee
   */
  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reactivate employee' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Employee reactivated successfully',
    type: EmployeeResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async reactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.reactivate(id, currentUser);
  }

  /**
   * POST /employees/:id/assign-role
   * Assign specialized role
   */
  @Post(':id/assign-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign specialized role' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiOkResponse({
    description: 'Role assigned successfully',
    type: EmployeeResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden - ADMIN only' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Invalid role assignment' })
  async assignRole(
    @Param('id') id: string,
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() currentUser: { employeeId: number; role: string },
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.assignSpecializedRole(id, assignRoleDto, currentUser);
  }
}
