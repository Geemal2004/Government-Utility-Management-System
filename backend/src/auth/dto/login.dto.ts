import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for employee login request
 */
export class LoginDto {
  @ApiProperty({
    description: 'Username or email address',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'Username or email is required' })
  @IsString({ message: 'Username or email must be a string' })
  usernameOrEmail: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
