import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ApiGatewayService {
    constructor(
        @Inject('ANALYTICS_SERVICE')
        private readonly analyticsService: ClientProxy,

        @Inject('USERS_SERVICE')
        private readonly usersService: ClientProxy,
    ) {}

    getHello(): string {
        return 'Hello World!';
    }

    getAnalytics(): object {
        return this.analyticsService.send({ cmd: 'get_analytics' }, {});
    }

    getUsers(): object {
        return this.usersService.send({ cmd: 'getHello' }, {});
    }
}
