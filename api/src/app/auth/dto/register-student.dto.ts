import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for student registration requests.
 *
 * Validates the payload sent by the student-app Registration component.
 * Validation rules mirror the front-end FormGroup validators.
 */
export class RegisterStudentDto {
  @ApiProperty({ description: 'First name (2-50 chars)', example: 'Alice' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Last name (2-50 chars)', example: 'Smith' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'Valid email address',
    example: 'alice@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Password – min 8 chars, at least 1 uppercase, 1 number, 1 special character',
    example: 'Secret1!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ description: 'Grade level (1-12)', example: '3' })
  @IsString()
  grade: string;

  @ApiPropertyOptional({
    description: 'Selected learning goals',
    example: ['math', 'science'],
  })
  @IsArray()
  @IsOptional()
  learningGoals?: string[];

  @ApiPropertyOptional({
    description: 'Avatar identifier',
    example: 'avatar-2',
  })
  @IsString()
  @IsOptional()
  selectedAvatar?: string | null;
}
