import { Module } from '@nestjs/common';
import { ShortlinkResolverController } from './shortlink-resolver.controller';
import { ShortlinkResolverService } from './shortlink-resolver.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from '../../../typeOrm.config';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) =>
                buildTypeOrmOptions({
                    configService: config,
                    schema: 'shortlink_resolver',
                    entities: [],
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
    ],
    controllers: [ShortlinkResolverController],
    providers: [ShortlinkResolverService],
})
export class ShortlinkResolverModule {}
