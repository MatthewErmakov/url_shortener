import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ShortlinkResolverService {
    constructor(
        @Inject('USERS_SERVICE') private readonly usersService: ClientProxy,
        @Inject('ANALYTICS_SERVICE') private readonly analyticsService: ClientProxy,
        @Inject('QUOTA_SERVICE') private readonly quotaService: ClientProxy,
    ) {}

    getHello(): string {
        return 'Hello World!';
    }

    getUsersHello(): object {
        return this.usersService.send({ cmd: 'getHello' }, {});
    }
}
