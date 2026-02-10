import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(ApiGatewayModule, {
        logger: ['log', 'error', 'warn'],
    });

    const config = app.get(ConfigService);

    await app.listen(config.get<string>('API_GATEWAY_PORT') ?? 3000);
}

bootstrap();
