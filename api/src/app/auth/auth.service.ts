import {
  Injectable,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginStudentDto } from './dto/login-student.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';

/**
 * Service handling student authentication operations.
 *
 * Responsibilities:
 * - Student registration with password hashing
 * - Email uniqueness checks
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Register a new student account.
   *
   * @param dto - Validated registration payload
   * @returns The created user document (without password)
   * @throws ConflictException when the email is already in use
   */
  async registerStudent(dto: RegisterStudentDto) {
    // Check for duplicate email
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = new this.userModel({
        email: dto.email,
        password: hashedPassword,
        role: 'student',
        profile: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          grade: Number(dto.grade),
        },
        learningGoals: dto.learningGoals ?? [],
        selectedAvatar: dto.selectedAvatar ?? null,
      });

      const saved = await user.save();
      this.logger.log(`Student registered: ${saved.email}`);

      // Return user data without the password hash
      const result = saved.toObject();
      delete result.password;
      return result;
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Authenticate a student with email and password.
   *
   * @param dto - Login credentials
   * @returns JWT token and user data matching the frontend LoginResponse interface
   * @throws UnauthorizedException for invalid credentials
   */
  async loginStudent(dto: LoginStudentDto) {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    this.logger.log(`Student logged in: ${user.email}`);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        role: user.role,
      },
    };
  }

  /**
   * Check whether an email address is already in use.
   *
   * @param email - Email to check
   * @returns Object with `exists` boolean
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    const user = await this.userModel.findOne({ email }).exec();
    return { exists: !!user };
  }

  async loginAdmin(dto: LoginAdminDto) {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!['admin', 'teacher'].includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    if (user.isActive === false) {
      throw new ForbiddenException('Account is disabled');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    this.logger.log(`Admin/teacher logged in: ${user.email} (${user.role})`);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        role: user.role,
      },
    };
  }

  async registerAdmin(dto: RegisterAdminDto) {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = new this.userModel({
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        profile: {
          firstName: dto.firstName,
          lastName: dto.lastName,
        },
        isActive: true,
      });

      const saved = await user.save();
      this.logger.log(
        `Admin/teacher registered: ${saved.email} (${saved.role})`
      );

      const result = saved.toObject();
      delete result.password;
      return result;
    } catch (error) {
      this.logger.error('Admin registration failed', error);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: user.profile,
    };
  }

  /**
   * List all admin/teacher users with basic info.
   */
  async getStaffUsers() {
    const users = await this.userModel
      .find({ role: { $in: ['admin', 'teacher'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();

    return users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      role: u.role,
      profile: u.profile,
      isActive: u.isActive !== false,
      createdAt: (u as any).createdAt,
    }));
  }

  /**
   * Return summary stats for admin/teacher users.
   */
  async getStaffStats() {
    const staff = await this.userModel
      .find({ role: { $in: ['admin', 'teacher'] } })
      .select('role isActive')
      .exec();

    const total = staff.length;
    const active = staff.filter((u) => u.isActive !== false).length;
    const disabled = total - active;
    const admins = staff.filter((u) => u.role === 'admin').length;
    const teachers = staff.filter((u) => u.role === 'teacher').length;

    return { total, active, disabled, admins, teachers };
  }

  /**
   * Enable or disable a staff user account.
   */
  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!['admin', 'teacher'].includes(user.role)) {
      throw new ForbiddenException('Can only toggle staff accounts');
    }

    user.isActive = isActive;
    await user.save();

    this.logger.log(`User ${user.email} ${isActive ? 'enabled' : 'disabled'}`);

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
