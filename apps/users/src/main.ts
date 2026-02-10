// main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { UsersModule } from './users.module';

async function bootstrap() {
    const appContext = await NestFactory.createApplicationContext(UsersModule, {
        logger: ['log', 'error', 'warn'],
    });

    const config: ConfigService = appContext.get(ConfigService);

    const host: string = config.get<string>('USERS_HOST') ?? 'localhost';
    const port: number = Number(config.get<string>('USERS_PORT') ?? 4001);

    const microservice =
        await NestFactory.createMicroservice<MicroserviceOptions>(UsersModule, {
            transport: Transport.TCP,
            options: { host, port },
            logger: ['log', 'error', 'warn'],
        });

    await microservice.listen();

    console.log(`[UsersService] TCP microservice listening on ${host}:${port}`);
}

bootstrap();
