import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
    const host = process.env.USERS_HOST ?? 'localhost';
    const port = Number(process.env.USERS_TCP_PORT ?? 3005);
    const httpPort = Number(process.env.USERS_HTTP_PORT ?? 3050);

    const app = await NestFactory.create(UsersModule, {
        logger: ['log', 'error', 'warn'],
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { host, port },
    });

    await app.startAllMicroservices();
    await app.listen(httpPort, host);

    console.log(`[UsersService] TCP listening on ${host}:${port}`);
    console.log(`[UsersService] HTTP listening on http://${host}:${httpPort}`);
}
bootstrap();
