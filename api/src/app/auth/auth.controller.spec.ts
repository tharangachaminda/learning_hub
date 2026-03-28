import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockLoginResult = {
    token: 'mock-jwt-token',
    user: {
      id: 'admin-id-123',
      email: 'admin@learninghub.local',
      name: 'System Admin',
      role: 'admin',
    },
  };

  const mockProfile = {
    id: 'admin-id-123',
    email: 'admin@learninghub.local',
    role: 'admin',
    profile: { firstName: 'System', lastName: 'Admin' },
  };

  beforeEach(async () => {
    const mockAuthService = {
      registerStudent: jest.fn(),
      loginStudent: jest.fn(),
      checkEmailExists: jest.fn(),
      loginAdmin: jest.fn().mockResolvedValue(mockLoginResult),
      registerAdmin: jest.fn().mockResolvedValue({
        _id: 'new-id',
        email: 'teacher@school.nz',
        role: 'teacher',
        profile: { firstName: 'Jane', lastName: 'Doe' },
      }),
      getProfile: jest.fn().mockResolvedValue(mockProfile),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('POST /auth/admin/login', () => {
    it('should return JWT token on successful admin login', async () => {
      const result = await controller.adminLogin({
        email: 'admin@learninghub.local',
        password: 'AdminPass1!',
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.role).toBe('admin');
      expect(authService.loginAdmin).toHaveBeenCalledWith({
        email: 'admin@learninghub.local',
        password: 'AdminPass1!',
      });
    });
  });

  describe('POST /auth/admin/register', () => {
    it('should create a new teacher account', async () => {
      const result = await controller.adminRegister({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'teacher@school.nz',
        password: 'TeacherPass1!',
        role: 'teacher',
      });

      expect(result.email).toBe('teacher@school.nz');
      expect(result.role).toBe('teacher');
      expect(authService.registerAdmin).toHaveBeenCalled();
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      const mockReq = { user: { userId: 'admin-id-123' } };

      const result = await controller.getProfile(mockReq);

      expect(result.email).toBe('admin@learninghub.local');
      expect(result.role).toBe('admin');
      expect(authService.getProfile).toHaveBeenCalledWith('admin-id-123');
    });
  });
});
