import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readFileSync } from 'node:fs';
import { Request } from 'express';
import { JWT_API_KEY_STRATEGY } from '../constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtApiKeyStrategy extends PassportStrategy(
    Strategy,
    JWT_API_KEY_STRATEGY,
) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    const auth = req?.headers?.['authorization'] as string;
                    return auth?.replace(/^Bearer\s+/i, '');
                },
            ]),
            secretOrKey: readFileSync(
                config.getOrThrow<string>('JWT_PUBLIC_KEY_PATH'),
                'utf8',
            ),
            algorithms: ['RS256'],
            ignoreExpiration: false,
        });
    }

    async validate(payload: JwtPayload): Promise<JwtPayload> {
        return payload;
    }
}
