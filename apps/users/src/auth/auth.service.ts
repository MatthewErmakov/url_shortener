import { Body, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterUser } from './dto/register-user.dto';
import { LoginUser } from './dto/login-user.dto';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    register(registerUserDTO: RegisterUser): object {
        return {
            accessToken: this.jwtService.sign({
                email: 'blalbaasdas@asdas.com',
                password: '232232',
            }),
        };
    }

    login(loginUserDTO: LoginUser): object {
        return {
            accessToken: this.jwtService.verify('123'),
        };
    }

    verifyToken(token: string): object {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            return error;
        }
    }
}
