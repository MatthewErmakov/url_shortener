import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDTO } from './dto/login-user.dto';
import { User } from '../users/entities/users.entity';
import { AuthorizedDTO } from './dto/authorized.dto';
import { MeDTO } from './dto/me.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(ApiKeyGuard)
    @Get('me')
    async me(@Req() req: AuthenticatedRequest): Promise<User> {
        return req.user;
    }

    @Post('login')
    async login(@Body() loginUserDTO: LoginUserDTO): Promise<AuthorizedDTO> {
        return await this.authService.login(loginUserDTO);
    }
}
