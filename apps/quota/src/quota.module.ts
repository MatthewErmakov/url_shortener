import { Module } from '@nestjs/common';
import { QuotaController } from './quota.controller';
import { QuotaService } from './quota.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: join(process.cwd(), '.env'),
            isGlobal: true,
        }),
    ],
    controllers: [QuotaController],
    providers: [QuotaService],
})
export class QuotaModule {}
