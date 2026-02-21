import { IsEmail, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for student login requests.
 *
 * Matches the `LoginRequest` interface in the student-app AuthService.
 */
export class LoginStudentDto {
  @ApiProperty({ description: 'Student email address', example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Student password', example: 'Secret1!' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Whether to persist session', example: false })
  @IsBoolean()
  rememberMe: boolean;
}
