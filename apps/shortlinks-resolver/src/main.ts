import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import {
    GlobalHttpExceptionFilter,
    SnakeCaseResponseInterceptor,
} from '@libs/shared';

async function bootstrap() {
    const host = process.env.SHORTLINKS_RESOLVER_HOST ?? 'localhost';
    const port = Number(process.env.SHORTLINKS_RESOLVER_TCP_PORT ?? 3040);
    const httpPort = Number(process.env.SHORTLINKS_RESOLVER_HTTP_PORT ?? 3004);

    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn'],
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { host, port },
    });

    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new SnakeCaseResponseInterceptor());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.startAllMicroservices();
    await app.listen(httpPort, host);

    console.log(`[ShortlinkResolver] TCP listening on ${host}:${port}`);
    console.log(
        `[ShortlinkResolver] HTTP listening on http://${host}:${httpPort}`,
    );
}
bootstrap();
