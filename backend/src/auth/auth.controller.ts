import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerLoginResponseDto } from './dto/customer-login-response.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { EmployeeResponseDto } from '../employees/dto/employee-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOperation({ summary: 'Employee login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('customer/login')
  @ApiOperation({ summary: 'Customer login' })
  @ApiBody({ type: CustomerLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Customer login successful',
    type: CustomerLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async customerLogin(@Body() loginDto: CustomerLoginDto): Promise<CustomerLoginResponseDto> {
    return await this.authService.customerLogin(loginDto);
  }

  @Post('customer/register')
  @ApiOperation({ summary: 'Customer self-registration' })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or identity reference already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async customerRegister(@Body() registerDto: CustomerRegisterDto) {
    return await this.authService.registerCustomer(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Request() req: any): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.authService.getProfile(req.user.employeeId);
    return {
      success: true,
      data: EmployeeResponseDto.fromEntity(employee),
      message: 'Profile retrieved successfully',
    };
  }
}
