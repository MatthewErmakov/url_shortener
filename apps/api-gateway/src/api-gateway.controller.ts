import { Controller, Get } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';

@Controller()
export class ApiGatewayController {
    constructor(private readonly apiGatewayService: ApiGatewayService) {}

    @Get()
    getHello(): string {
        return this.apiGatewayService.getHello();
    }

    @Get('analytics')
    getAnalytics(): object {
        return this.apiGatewayService.getAnalytics();
    }

    @Get('users')
    getUsers(): object {
        return this.apiGatewayService.getUsers();
    }
}
