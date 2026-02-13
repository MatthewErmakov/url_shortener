import { Controller, Get, Param } from '@nestjs/common';
import { ShortlinkResolverService } from './shortlink-resolver.service';
import { MessagePattern } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

@Controller()
export class ShortlinkResolverController {
    constructor(
        private readonly shortlinkResolverService: ShortlinkResolverService,
        private readonly jwtService: JwtService,
    ) {}

    @Get()
    getHello(): string {
        return this.shortlinkResolverService.getHello();
    }

    @Get('users-hello')
    getUsersHello(): object {
        return this.shortlinkResolverService.getUsersHello();
    }

    @MessagePattern({ cmd: 'get_shortlink' })
    getShortlink(): string {
        return this.shortlinkResolverService.getHello();
    }

    @Get('auth/verify-token/:token')
    verifyToken(@Param('token') token: string): object {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            return error;
        }
    }
}
