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
import { readFileSync } from 'fs';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [
                join(process.cwd(), '.env'),
                join(process.cwd(), '.env.users'),
            ],
            isGlobal: true,
        }),

        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const privateKey = readFileSync(
                    config.getOrThrow<string>('JWT_PRIVATE_KEY_PATH'),
                    'utf8',
                );
                const publicKey = readFileSync(
                    config.getOrThrow<string>('JWT_PUBLIC_KEY_PATH'),
                    'utf8',
                );

                return {
                    privateKey,
                    publicKey,
                    signOptions: {
                        algorithm: 'RS256',
                        expiresIn: '15m',
                        keyid: config.getOrThrow<string>('JWT_KID'),
                    },
                    verifyOptions: {
                        algorithms: ['RS256'],
                    },
                };
            },
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
                name: 'SHORTLINKS_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('SHORTLINKS_RESOLVER_HOST'),
                        port: config.get<number>(
                            'SHORTLINKS_RESOLVER_TCP_PORT',
                        ),
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
