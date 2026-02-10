import { Controller, Get } from '@nestjs/common';
import { QuotaService } from './quota.service';

@Controller()
export class QuotaController {
    constructor(private readonly quotaService: QuotaService) {}

    @Get()
    getHello(): string {
        return this.quotaService.getHello();
    }
}
