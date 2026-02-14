import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const host = process.env.USERS_HOST ?? 'localhost';
    const port = Number(process.env.USERS_TCP_PORT ?? 3005);
    const httpPort = Number(process.env.USERS_HTTP_PORT ?? 3050);

    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn'],
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { host, port },
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.startAllMicroservices();
    await app.listen(httpPort, host);

    console.log(`[UsersService] TCP listening on ${host}:${port}`);
    console.log(`[UsersService] HTTP listening on http://${host}:${httpPort}`);
}
bootstrap();
