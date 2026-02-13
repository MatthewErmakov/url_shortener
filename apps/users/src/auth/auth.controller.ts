import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUser } from './dto/register-user.dto';
import { LoginUser } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() registerUserDTO: RegisterUser) {
        return this.authService.register(registerUserDTO);
    }

    @Post('login')
    login(@Body() loginUserDTO: LoginUser) {
        return this.authService.login(loginUserDTO);
    }

    @Get('verify-token/:token')
    verifyToken(@Param('token') token: string): object {
        console.log(token);
        return this.authService.verifyToken(token);
    }
}
