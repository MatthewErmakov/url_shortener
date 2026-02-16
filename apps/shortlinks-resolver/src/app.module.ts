import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from '../../../typeOrm.config';
import { JwtModule } from '@nestjs/jwt';
import { ShortlinksModule } from './shortlinks/shortlinks.module';
import { JwtApiKeyStrategy } from '@libs/auth-jwt';
import { join } from 'path';
import { ShortLink } from './shortlinks/entities/shortlink.entity';
import { CoreModule } from './core.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [join(process.cwd(), '.env')],
            isGlobal: true,
        }),

        TypeOrmModule.forFeature([ShortLink]),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) =>
                buildTypeOrmOptions({
                    configService: config,
                    schema: 'shortlinks_resolver',
                    entities: [ShortLink],
                }),
        }),

        CoreModule,

        JwtModule.registerAsync({
            inject: [ConfigService],

            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),

        ShortlinksModule,
    ],
    controllers: [AppController],
    providers: [AppService, JwtApiKeyStrategy],
})
export class AppModule {}
