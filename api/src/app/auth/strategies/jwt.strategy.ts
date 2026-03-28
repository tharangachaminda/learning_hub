import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from '../schemas/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'learning-hub-dev-secret'
      ),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel
      .findById(payload.sub)
      .select('-password')
      .exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
