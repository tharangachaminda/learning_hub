import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../schemas/user.schema';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userModel: any;

  const mockUser = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    email: 'admin@learninghub.local',
    role: 'admin',
    profile: { firstName: 'System', lastName: 'Admin' },
  };

  beforeEach(async () => {
    userModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user data from JWT payload', async () => {
    const payload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'admin@learninghub.local',
      role: 'admin',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: '507f1f77bcf86cd799439011',
      email: 'admin@learninghub.local',
      role: 'admin',
    });
    expect(userModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    const payload = {
      sub: 'nonexistent-id',
      email: 'nobody@test.com',
      role: 'admin',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
