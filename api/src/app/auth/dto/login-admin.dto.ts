import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAdminDto {
  @ApiProperty({
    description: 'Admin/teacher email address',
    example: 'admin@learninghub.local',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password', example: 'AdminPass1!' })
  @IsString()
  password: string;
}
