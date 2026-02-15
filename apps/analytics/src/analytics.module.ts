import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analytics } from './analytics.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildTypeOrmOptions } from '../../../typeOrm.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: join(process.cwd(), '.env'),
            isGlobal: true,
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

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) =>
                buildTypeOrmOptions({
                    configService: config,
                    schema: 'analytics',
                    entities: [Analytics],
                }),
        }),

        TypeOrmModule.forFeature([Analytics]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
})
export class AnalyticsModule {}
