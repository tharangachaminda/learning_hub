import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';

/**
 * Controller for student authentication endpoints.
 *
 * Route prefix: `auth` (combined with the global `/api` prefix
 * gives `/api/auth/…`).
 *
 * Endpoints consumed by the student-app:
 *   POST /api/auth/student/register  – create a new student account
 *   GET  /api/auth/check-email/:email – check email uniqueness
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new student.
   *
   * @param dto - Registration payload (validated by class-validator)
   * @returns Created user data (without password)
   */
  @Post('student/register')
  async register(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
  }

  /**
   * Authenticate a student.
   *
   * @param dto - Login credentials (validated by class-validator)
   * @returns JWT token and user data
   */
  @Post('student/login')
  async login(@Body() dto: LoginStudentDto) {
    return this.authService.loginStudent(dto);
  }

  /**
   * Check whether an email is already taken.
   *
   * @param email - Email address to verify
   * @returns `{ exists: boolean }`
   */
  @Get('check-email/:email')
  async checkEmail(@Param('email') email: string) {
    return this.authService.checkEmailExists(email);
  }
}
