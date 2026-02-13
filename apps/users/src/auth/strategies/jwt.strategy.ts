import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'x-api-key') {
    constructor(
        config: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req?.headers['x-api-key'] as string,
            ]),
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
        });
    }

    async validate(payload: { sub: number; email: string }) {
        const user = await this.usersService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException('Invalid token.');
        }

        return user;
    }
}
