import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildTypeOrmOptions } from '../../../typeOrm.config';
import { User } from './users/entities/users.entity';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: join(process.cwd(), '.env'),
            isGlobal: true,
        }),

        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1d' },
            }),
        }),

        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) =>
                buildTypeOrmOptions({
                    configService: config,
                    schema: 'users',
                    entities: [User],
                }),
        }),

        ClientsModule.registerAsync([
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
                name: 'SHORTLINK_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('SHORTLINK_RESOLVER_HOST'),
                        port: config.get<number>('SHORTLINK_RESOLVER_TCP_PORT'),
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
    ],
    controllers: [AppController],
    providers: [AppService],
    exports: [ClientsModule, JwtModule],
})
export class CoreModule {}
