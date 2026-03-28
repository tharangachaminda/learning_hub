import {
  IsEmail,
  IsString,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdminDto {
  @ApiProperty({ description: 'First name', example: 'Jane' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'jane.doe@school.nz',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Password – min 8 chars, at least 1 uppercase, 1 number, 1 special character',
    example: 'TeacherPass1!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    description: 'Role to assign — admin or teacher',
    example: 'teacher',
    enum: ['admin', 'teacher'],
  })
  @IsIn(['admin', 'teacher'])
  role: 'admin' | 'teacher';
}
