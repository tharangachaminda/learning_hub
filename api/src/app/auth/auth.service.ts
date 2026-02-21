import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
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
}
