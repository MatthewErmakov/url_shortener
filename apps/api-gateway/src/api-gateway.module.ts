import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: join(process.cwd(), '.env'),
            isGlobal: true,
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
                        port: config.get<number>('ANALYTICS_PORT'),
                    },
                }),
            },
            {
                name: 'USERS_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],

                useFactory: (config: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: config.get<string>('USERS_HOST'),
                        port: config.get<number>('USERS_PORT'),
                    },
                }),
            },
        ]),
    ],
    controllers: [ApiGatewayController],
    providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
