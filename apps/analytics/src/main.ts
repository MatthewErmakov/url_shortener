import { NestFactory } from '@nestjs/core';
import { AnalyticsModule } from './analytics.module';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from '@libs/shared';

async function bootstrap() {
    const host = process.env.ANALYTICS_HOST ?? 'localhost';
    const port = Number(process.env.ANALYTICS_TCP_PORT ?? 3041);
    const httpPort = Number(process.env.ANALYTICS_HTTP_PORT ?? 3001);

    const app = await NestFactory.create(AnalyticsModule, {
        logger: ['log', 'error', 'warn'],
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { host, port },
    });

    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.startAllMicroservices();
    await app.listen(httpPort, host);

    console.log(`[Analytics] TCP listening on ${host}:${port}`);
    console.log(`[Analytics] HTTP listening on http://${host}:${httpPort}`);
}

bootstrap();
