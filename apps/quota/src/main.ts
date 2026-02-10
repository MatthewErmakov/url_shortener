// main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { QuotaModule } from './quota.module';

async function bootstrap() {
    const appContext = await NestFactory.createApplicationContext(QuotaModule, {
        logger: ['log', 'error', 'warn'],
    });

    const config: ConfigService = appContext.get(ConfigService);

    const host: string = config.get<string>('QUOTA_HOST') ?? 'localhost';
    const port: number = Number(config.get<string>('QUOTA_PORT') ?? 4005);

    const microservice =
        await NestFactory.createMicroservice<MicroserviceOptions>(QuotaModule, {
            transport: Transport.TCP,
            options: { host, port },
            logger: ['log', 'error', 'warn'],
        });

    await microservice.listen();

    console.log(`[UsersService] TCP microservice listening on ${host}:${port}`);
}

bootstrap();
