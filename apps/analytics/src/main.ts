import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AnalyticsModule } from './analytics.module';

async function bootstrap() {
    const app = await NestFactory.create(AnalyticsModule, {
        logger: ['log', 'error', 'warn'],
    });

    const config = app.get(ConfigService);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.TCP,
        options: {
            host: config.get<string>('ANALYTICS_HOST'),
            port: config.get<number>('ANALYTICS_PORT'),
        },
    });

    await app.startAllMicroservices();
}
bootstrap();
