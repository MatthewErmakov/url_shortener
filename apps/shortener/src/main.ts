import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ShortenerModule } from './shortener.module';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
        ShortenerModule,
        {
            transport: Transport.TCP,
            options: {
                host: '0.0.0.0',
                port: process.env.SHORTENER_PORT
                    ? parseInt(process.env.SHORTENER_PORT)
                    : 4002,
            },
        },
    );
    await app.listen();
}
bootstrap();
