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
import { ApiKeyGuard, JwtPayload } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '../../../../libs/auth-jwt/src/interfaces/authenticated-request.interface';
import { XApiKeyDTO } from './dto/x-api-key.dto';
import { AccessTokenDTO } from './dto/access-token.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(ApiKeyGuard)
    @Get('me')
    async me(@Req() req: AuthenticatedRequest): Promise<JwtPayload> {
        return req.user;
    }

    @Post('login')
    async login(@Body() loginUserDTO: LoginUserDTO): Promise<AuthorizedDTO> {
        return await this.authService.login(loginUserDTO);
    }

    @Post('token')
    async getToken(@Headers() tokenDTO: XApiKeyDTO): Promise<AccessTokenDTO> {
        return await this.authService.generateTokenByApiKey(tokenDTO.xApiKey);
    }
}
