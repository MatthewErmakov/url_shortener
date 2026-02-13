import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UsersService {
    constructor(
        @Inject('ANALYTICS_SERVICE')
        private readonly analyticsService: ClientProxy,
    ) {}

    getHello(): object {
        return { message: 'Hello World! from UsersService 123 4321' };
    }

    getHelloAnalytics(): object {
        this.analyticsService.emit({ cmd: 'get_analytics' }, {});
        return {
            message: 'Analytics event emitted.',
        };
    }
}
