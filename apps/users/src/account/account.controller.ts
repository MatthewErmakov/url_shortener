import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '../../../../libs/auth-jwt/src/interfaces/authenticated-request.interface';
import { UsersService } from '../users/users.service';
import { UserQuotaResponse } from '../users/types/user-quota-response.type';
import { UserMeResponse } from '../users/types/user-me-response.type';

@UseGuards(ApiKeyGuard)
@Controller('account')
export class AccountController {
    constructor(private readonly usersService: UsersService) {}

    @Get('quota')
    async quota(@Req() req: AuthenticatedRequest): Promise<UserQuotaResponse> {
        return this.usersService.meQuota(Number(req.user.sub));
    }

    @Post('subscribe')
    async subscribe(@Req() req: AuthenticatedRequest): Promise<UserMeResponse> {
        return this.usersService.subscribe(Number(req.user.sub));
    }

    @Post('unsubscribe')
    async unsubscribe(
        @Req() req: AuthenticatedRequest,
    ): Promise<UserMeResponse> {
        return this.usersService.unsubscribe(Number(req.user.sub));
    }
}
