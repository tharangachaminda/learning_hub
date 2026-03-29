import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  const mockAdminUser = {
    _id: { toString: () => 'admin-id-123' },
    email: 'admin@learninghub.local',
    password: '$2b$10$hashedpassword',
    role: 'admin',
    profile: { firstName: 'System', lastName: 'Admin' },
    toObject: function () {
      return { ...this };
    },
    save: jest.fn(),
  };

  const mockTeacherUser = {
    _id: { toString: () => 'teacher-id-456' },
    email: 'teacher@school.nz',
    password: '$2b$10$hashedpassword',
    role: 'teacher',
    profile: { firstName: 'Jane', lastName: 'Teacher' },
  };

  const mockStudentUser = {
    _id: { toString: () => 'student-id-789' },
    email: 'student@example.com',
    password: '$2b$10$hashedpassword',
    role: 'student',
    profile: { firstName: 'Demo', lastName: 'Student', grade: 3 },
  };

  beforeEach(async () => {
    userModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: { toString: () => 'new-user-id' },
        toObject: function () {
          return { ...this };
        },
      }),
    }));
    userModel.findOne = jest.fn();
    userModel.findById = jest.fn();
    userModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginAdmin', () => {
    it('should login admin with valid credentials and return JWT', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAdminUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.loginAdmin({
        email: 'admin@learninghub.local',
        password: 'AdminPass1!',
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.role).toBe('admin');
      expect(result.user.email).toBe('admin@learninghub.local');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'admin-id-123',
        email: 'admin@learninghub.local',
        role: 'admin',
      });
    });

    it('should login teacher with valid credentials', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTeacherUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.loginAdmin({
        email: 'teacher@school.nz',
        password: 'TeacherPass1!',
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.role).toBe('teacher');
    });

    it('should reject student from admin login with 403', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudentUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.loginAdmin({
          email: 'student@example.com',
          password: 'Password1!',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject with UnauthorizedException for invalid email', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.loginAdmin({
          email: 'nonexistent@test.com',
          password: 'anything',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject with UnauthorizedException for wrong password', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAdminUser),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.loginAdmin({
          email: 'admin@learninghub.local',
          password: 'wrong-password',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerAdmin', () => {
    it('should create a new admin/teacher account', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');

      const result = await service.registerAdmin({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@school.nz',
        password: 'TeacherPass1!',
        role: 'teacher',
      });

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });

    it('should reject duplicate email with ConflictException', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAdminUser),
      });

      await expect(
        service.registerAdmin({
          firstName: 'Duplicate',
          lastName: 'User',
          email: 'admin@learninghub.local',
          password: 'Pass1!',
          role: 'admin',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAdminUser),
        }),
      });

      const result = await service.getProfile('admin-id-123');

      expect(result).toEqual({
        id: 'admin-id-123',
        email: 'admin@learninghub.local',
        role: 'admin',
        profile: { firstName: 'System', lastName: 'Admin' },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('getStaffUsers', () => {
    it('should return list of admin/teacher users without passwords', async () => {
      const staffUsers = [
        {
          _id: { toString: () => 'admin-id-123' },
          email: 'admin@learninghub.local',
          role: 'admin',
          profile: { firstName: 'System', lastName: 'Admin' },
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          _id: { toString: () => 'teacher-id-456' },
          email: 'teacher@school.nz',
          role: 'teacher',
          profile: { firstName: 'Jane', lastName: 'Teacher' },
          isActive: true,
          createdAt: new Date('2024-02-01'),
        },
      ];

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(staffUsers),
          }),
        }),
      });

      const result = await service.getStaffUsers();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('admin@learninghub.local');
      expect(result[1].role).toBe('teacher');
      expect(userModel.find).toHaveBeenCalledWith({
        role: { $in: ['admin', 'teacher'] },
      });
    });
  });

  describe('getStaffStats', () => {
    it('should return correct stats breakdown', async () => {
      const staffUsers = [
        { role: 'admin', isActive: true },
        { role: 'teacher', isActive: true },
        { role: 'teacher', isActive: false },
      ];

      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(staffUsers),
        }),
      });

      const result = await service.getStaffStats();

      expect(result).toEqual({
        total: 3,
        active: 2,
        disabled: 1,
        admins: 1,
        teachers: 2,
      });
    });
  });

  describe('toggleUserStatus', () => {
    it('should disable a staff user', async () => {
      const mockUser = {
        _id: { toString: () => 'teacher-id-456' },
        email: 'teacher@school.nz',
        role: 'teacher',
        isActive: true,
        save: jest.fn().mockResolvedValue(undefined),
      };

      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.toggleUserStatus('teacher-id-456', false);

      expect(result.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should enable a disabled staff user', async () => {
      const mockUser = {
        _id: { toString: () => 'teacher-id-456' },
        email: 'teacher@school.nz',
        role: 'teacher',
        isActive: false,
        save: jest.fn().mockResolvedValue(undefined),
      };

      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.toggleUserStatus('teacher-id-456', true);

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException for unknown user', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.toggleUserStatus('unknown-id', false)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for student accounts', async () => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStudentUser),
      });

      await expect(
        service.toggleUserStatus('student-id-789', false)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('loginAdmin - disabled account', () => {
    it('should reject disabled admin with ForbiddenException', async () => {
      const disabledAdmin = { ...mockAdminUser, isActive: false };
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(disabledAdmin),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.loginAdmin({
          email: 'admin@learninghub.local',
          password: 'AdminPass1!',
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
