// main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { RedirectModule } from './redirect.module';

async function bootstrap() {
    const appContext = await NestFactory.createApplicationContext(
        RedirectModule,
        {
            logger: ['log', 'error', 'warn'],
        },
    );

    const config: ConfigService = appContext.get(ConfigService);

    const host: string = config.get<string>('REDIRECT_HOST') ?? 'localhost';
    const port: number = Number(config.get<string>('REDIRECT_PORT') ?? 4003);

    const microservice =
        await NestFactory.createMicroservice<MicroserviceOptions>(
            RedirectModule,
            {
                transport: Transport.TCP,
                options: { host, port },
                logger: ['log', 'error', 'warn'],
            },
        );

    await microservice.listen();

    console.log(`[UsersService] TCP microservice listening on ${host}:${port}`);
}

bootstrap();
