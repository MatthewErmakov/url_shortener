import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDTO } from './dto/create-user.dto';
import { AuthorizedDTO } from '../auth/dto/authorized.dto';
import { SubscriptionType } from '@libs/shared';

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

    @MessagePattern({ cmd: 'get_user_subscription_type' })
    async getUserSubscriptionType(@Payload() payload: { userId: string }): Promise<{
        userId: string;
        subscriptionType: SubscriptionType;
    }> {
        return this.usersService.getUserSubscriptionType(payload.userId);
    }
}
