import { NestFactory } from '@nestjs/core';
import { ShortlinkResolverModule } from './shortlink-resolver.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
    const host = process.env.SHORTLINK_RESOLVER_HOST ?? 'localhost';
    const port = Number(process.env.SHORTLINK_RESOLVER_TCP_PORT ?? 3040);
    const httpPort = Number(process.env.SHORTLINK_RESOLVER_HTTP_PORT ?? 3004);

    const app = await NestFactory.create(ShortlinkResolverModule, {
        logger: ['log', 'error', 'warn'],
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { host, port },
    });

    await app.startAllMicroservices();
    await app.listen(httpPort, host);

    console.log(`[ShortlinkResolver] TCP listening on ${host}:${port}`);
    console.log(
        `[ShortlinkResolver] HTTP listening on http://${host}:${httpPort}`,
    );
}
bootstrap();
