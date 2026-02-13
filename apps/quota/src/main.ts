import { NestFactory } from '@nestjs/core';
import { QuotaModule } from './quota.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
    const host = process.env.QUOTA_HOST ?? 'localhost';
    const port = Number(process.env.QUOTA_TCP_PORT ?? 3020);
    const httpPort = Number(process.env.QUOTA_HTTP_PORT ?? 3002);

    const app = await NestFactory.create(QuotaModule, {
        logger: ['log', 'error', 'warn'],
    });

    app.connectMicroservice({
        transport: Transport.TCP,
        options: { host, port },
    });

    await app.startAllMicroservices();
    await app.listen(httpPort, host);

    console.log(`[Quota] TCP listening on ${host}:${port}`);
    console.log(`[Quota] HTTP listening on http://${host}:${httpPort}`);
}

bootstrap();
