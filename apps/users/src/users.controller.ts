import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('hello')
    @MessagePattern({ cmd: 'getHello' })
    getHello(): object {
        console.log('usersController.getHello called 321');
        return this.usersService.getHello();
    }

    @Get('hello-analytics')
    getHelloAnalytics(): object {
        return this.usersService.getHelloAnalytics();
    }
}
