import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from './entities/users.entity';
import { AuthorizedDTO } from '../auth/dto/authorized.dto';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('users')
    async create(@Body() createUserDTO: CreateUserDTO): Promise<AuthorizedDTO> {
        return await this.usersService.create(
            createUserDTO.email,
            createUserDTO.password,
        );
    }
}
