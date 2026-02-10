import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @MessagePattern({ cmd: 'get_analytics' })
    getHello(): object {
        return this.analyticsService.getHello();
    }
}
