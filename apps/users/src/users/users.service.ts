import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorizedDTO } from '../auth/dto/authorized.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @Inject('ANALYTICS_SERVICE')
        private readonly analyticsService: ClientProxy,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    getHello(): object {
        return { message: 'Hello World! from UsersService 123 4321' };
    }

    getHelloAnalytics(): object {
        this.analyticsService.emit({ cmd: 'get_analytics' }, {});
        return {
            message: 'Analytics event emitted.',
        };
    }

    async create(email: string, password: string): Promise<AuthorizedDTO> {
        const existingUser = await this.findByEmail(email);

        if (existingUser) {
            throw new BadRequestException('User already registered.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.usersRepository.create({
            email,
            password: hashedPassword,
        });
        const saved = await this.usersRepository.save(user);

        const payload = { sub: saved.id, email: saved.email };

        return {
            accessToken: this.jwtService.sign(payload),
        };
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: {
                email: email,
            },
        });
    }

    async findById(id: number): Promise<User | null> {
        return this.usersRepository.findOne({
            where: {
                id: id
            }
        })
    }
}
