import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from '../../../typeOrm.config';
import { JwtModule } from '@nestjs/jwt';
import { ShortlinksModule } from './shortlinks/shortlinks.module';
import { JwtApiKeyStrategy } from '@libs/auth-jwt';
import { join } from 'path';
import { User } from 'apps/users/src/users/entities/users.entity';
import { ShortLink } from './shortlinks/entities/shortlink.entity';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [
                join(process.cwd(), '.env'),
                join(process.cwd(), '.env.users'),
            ],
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

        ClientsModule.registerAsync([
            {
                name: 'USERS_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],

                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('USERS_HOST'),
                        port: config.get<number>('USERS_TCP_PORT'),
                    },
                }),
            },
            {
                name: 'ANALYTICS_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],

                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('ANALYTICS_HOST'),
                        port: config.get<number>('ANALYTICS_TCP_PORT'),
                    },
                }),
            },
            {
                name: 'QUOTA_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],

                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('QUOTA_HOST'),
                        port: config.get<number>('QUOTA_TCP_PORT'),
                    },
                }),
            },
        ]),

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
