import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

/**
 * Controller for authentication endpoints.
 *
 * Route prefix: `auth` (combined with the global `/api` prefix
 * gives `/api/auth/…`).
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

  /**
   * Authenticate an admin or teacher.
   *
   * POST /api/auth/admin/login
   */
  @Post('admin/login')
  async adminLogin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto);
  }

  /**
   * Invite-only registration for admin/teacher accounts.
   * Requires a valid admin JWT.
   *
   * POST /api/auth/admin/register
   */
  @Post('admin/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async adminRegister(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  /**
   * Return the current user's profile from the JWT.
   *
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  /**
   * List all admin/teacher users.
   *
   * GET /api/auth/admin/users
   */
  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getStaffUsers() {
    return this.authService.getStaffUsers();
  }

  /**
   * Get staff user stats (total, active, disabled, by role).
   *
   * GET /api/auth/admin/users/stats
   */
  @Get('admin/users/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getStaffStats() {
    return this.authService.getStaffStats();
  }

  /**
   * Enable or disable a staff user account.
   *
   * PATCH /api/auth/admin/users/:id/status
   */
  @Patch('admin/users/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async toggleUserStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean }
  ) {
    return this.authService.toggleUserStatus(id, body.isActive);
  }
}
