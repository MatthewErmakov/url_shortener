import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
    getHello(): object {
        console.log('AnalyticsService.getHello called 321 222');
        return { message: 'Hello World! from Analytics Service 12312 2222' };
    }
}
