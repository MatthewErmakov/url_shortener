import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analytics } from './entities/analytics.entity';
import { ShortlinkReflection } from './entities/shortlink-reflection.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildTypeOrmOptions } from '../../../typeOrm.config';
import { AuthJwtModule } from '@libs/auth-jwt';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [join(process.cwd(), '.env')],
            isGlobal: true,
        }),

        AuthJwtModule,

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
        ]),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) =>
                buildTypeOrmOptions({
                    configService: config,
                    schema: 'analytics',
                    entities: [Analytics, ShortlinkReflection],
                }),
        }),

        TypeOrmModule.forFeature([Analytics, ShortlinkReflection]),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
})
export class AnalyticsModule {}
