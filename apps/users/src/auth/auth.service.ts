import {
    BadRequestException,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDTO } from './dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/users.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizedDTO } from './dto/authorized.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async login(loginUserDTO: LoginUserDTO): Promise<AuthorizedDTO> {
        const user = await this.usersService.findByEmail(loginUserDTO.email);

        if (!user) {
            throw new BadRequestException('Invalid credentials.');
        }

        const passwordsMatch: boolean = await bcrypt.compare(
            loginUserDTO.password,
            user.password,
        );

        if (!passwordsMatch) {
            throw new BadRequestException('Invalid credentials.');
        }

        return {
            accessToken: await this.jwtService.signAsync({
                sub: user.id,
                email: user.email,
            }),
        };
    }

    async findByToken(token: string): Promise<User> {
        const decoded = await this.jwtService.decode(token);

        const user = await this.usersRepository.findOne({
            where: {
                id: decoded.sub,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid token.');
        }

        return user;
    }
}
