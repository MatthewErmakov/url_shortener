import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ApiKeyGuard } from './guards/api-key.guard';
import { JWT_API_KEY_STRATEGY } from './constants';
import { JwtApiKeyStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        ConfigModule,
        PassportModule.register({
            defaultStrategy: JWT_API_KEY_STRATEGY,
        }),
    ],
    providers: [JwtApiKeyStrategy, ApiKeyGuard],
    exports: [PassportModule, JwtApiKeyStrategy, ApiKeyGuard],
})
export class AuthJwtModule {}
