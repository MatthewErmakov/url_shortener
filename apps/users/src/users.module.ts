import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildTypeOrmOptions } from '../../../typeOrm.config';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: join(process.cwd(), '.env'),
            isGlobal: true,
        }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) =>
                buildTypeOrmOptions({
                    configService: config,
                    schema: 'users',
                    entities: [User],
                }),
        }),

        TypeOrmModule.forFeature([User]),

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

        AuthModule,
    ],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule {}
