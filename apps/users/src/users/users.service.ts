import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthorizedDTO } from '../auth/dto/authorized.dto';
import { SubscriptionType } from '@libs/shared';
import { UserMeResponse } from './types/user-me-response.type';
import { UserQuotaResponse } from './types/user-quota-response.type';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
    private static readonly MONTHLY_LIMIT_BY_SUBSCRIPTION: Record<
        SubscriptionType,
        number
    > = {
        [SubscriptionType.FREE]: 10,
        [SubscriptionType.PRO]: 100,
    };

    constructor(
        @Inject('ANALYTICS_SERVICE')
        private readonly analyticsService: ClientProxy,

        @Inject('SHORTLINKS_SERVICE')
        private readonly shortlinksService: ClientProxy,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async create(email: string, password: string): Promise<AuthorizedDTO> {
        const existingUser = await this.findByEmail(email);

        if (existingUser) {
            throw new BadRequestException('User already registered.');
        }

        const user = await this.usersRepository.create({
            email,
            xApiKey: `usr_${crypto.randomBytes(28).toString('hex')}`,
            password: await bcrypt.hash(password, 10),
        });
        const saved = await this.usersRepository.save(user);

        return {
            email: user.email,
            xApiKey: user.xApiKey,
        };
    }

    async me(id: number): Promise<UserMeResponse> {
        const user = await this.findById(id);

        return {
            email: user.email,
            xApiKey: user.xApiKey,
            subscriptionType: user.subscriptionType,
        };
    }

    async meQuota(id: number): Promise<UserQuotaResponse> {
        const user = await this.findById(id);
        const totalQuota =
            UsersService.MONTHLY_LIMIT_BY_SUBSCRIPTION[user.subscriptionType];

        const monthlyUsage = await firstValueFrom(
            this.shortlinksService.send<{
                userId: string;
                createdCount: number;
                periodStart: string;
                periodEnd: string;
            }>(
                { cmd: 'get_user_monthly_shortlinks_usage' },
                {
                    userId: String(user.id),
                },
            ),
        );

        const createdCount = monthlyUsage?.createdCount ?? 0;
        const remainingCount = Math.max(totalQuota - createdCount, 0);

        return {
            subscriptionType: user.subscriptionType,
            totalQuota,
            createdCount,
            remainingCount,
        };
    }

    async subscribe(id: number): Promise<UserMeResponse> {
        return this.setSubscriptionType(id, SubscriptionType.PRO);
    }

    async unsubscribe(id: number): Promise<UserMeResponse> {
        return this.setSubscriptionType(id, SubscriptionType.FREE);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: {
                email: email,
            },
        });
    }

    async findById(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: {
                id: id,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        return user;
    }

    async getUserSubscriptionType(userId: string): Promise<{
        userId: string;
        subscriptionType: SubscriptionType;
    }> {
        const parsedUserId = Number(userId);

        if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
            throw new BadRequestException('Invalid userId.');
        }

        const user = await this.usersRepository.findOne({
            where: { id: parsedUserId },
            select: ['id', 'subscriptionType'],
        });

        if (!user) {
            throw new NotFoundException('User not found.');
        }

        return {
            userId: String(user.id),
            subscriptionType: user.subscriptionType,
        };
    }

    private async setSubscriptionType(
        id: number,
        subscriptionType: SubscriptionType,
    ): Promise<UserMeResponse> {
        const user = await this.findById(id);

        if (user.subscriptionType === subscriptionType) {
            throw new ConflictException(
                `Your subscription type is already ${subscriptionType}.`,
            );
        }

        user.subscriptionType = subscriptionType;

        const savedUser = await this.usersRepository.save(user);

        return {
            email: savedUser.email,
            xApiKey: savedUser.xApiKey,
            subscriptionType: savedUser.subscriptionType,
        };
    }
}
