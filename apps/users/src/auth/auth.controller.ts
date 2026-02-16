import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDTO } from './dto/login-user.dto';
import { AuthorizedDTO } from './dto/authorized.dto';
import { ApiKeyGuard } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '../../../../libs/auth-jwt/src/interfaces/authenticated-request.interface';
import { AccessTokenDTO } from './dto/access-token.dto';
import { UsersService } from '../users/users.service';
import { UserMeResponse } from '../users/types/user-me-response.type';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
    ) {}

    @UseGuards(ApiKeyGuard)
    @Get('me')
    async me(@Req() req: AuthenticatedRequest): Promise<UserMeResponse> {
        return this.usersService.me(Number(req.user.sub));
    }

    @Post('login')
    async login(@Body() loginUserDTO: LoginUserDTO): Promise<AuthorizedDTO> {
        return await this.authService.login(loginUserDTO);
    }

    @Post('token')
    async getToken(
        @Headers('x-api-key') xApiKey: string,
    ): Promise<AccessTokenDTO> {
        return await this.authService.generateTokenByApiKey(xApiKey);
    }
}
