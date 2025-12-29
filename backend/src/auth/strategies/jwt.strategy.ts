import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { EmployeesService } from '../../employees/employees.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly employeesService: EmployeesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload and attach employee to request
   * This method is called by Passport after verifying the JWT signature
   * @param payload - Decoded JWT payload
   * @returns Employee data to be attached to request.user
   */
  async validate(payload: JwtPayload) {
    const employee = await this.employeesService.findById(payload.sub);

    if (!employee) {
      throw new UnauthorizedException('Invalid token - employee not found');
    }

    // Return the data that will be attached to request.user
    return {
      employeeId: employee.employeeId,
      username: employee.username,
      email: employee.email,
      role: employee.role,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: employee.fullName,
    };
  }
}
