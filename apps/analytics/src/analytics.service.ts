import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { SubscriptionType } from '@libs/shared';
import { Analytics } from './entities/analytics.entity';
import { TrackShortlinkClickEventDto } from './dto/track-shortlink-click-event.dto';
import { ShortlinkAnalyticsResponseDto } from './dto/shortlink-analytics-response.dto';

@Injectable()
export class AnalyticsService {
    private static readonly DEFAULT_LIMIT = 50;
    private static readonly MAX_LIMIT = 200;

    constructor(
        @Inject('USERS_SERVICE')
        private readonly usersClient: ClientProxy,

        @InjectRepository(Analytics)
        private readonly analyticsRepository: Repository<Analytics>,
    ) {}

    async recordClick(event: TrackShortlinkClickEventDto): Promise<void> {
        const clickEvent = this.analyticsRepository.create({
            shortlinkId: event.shortlinkId,
            shortCode: event.shortCode,
            ownerUserId: event.ownerUserId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            clickedAt: new Date(event.clickedAt),
        });

        await this.analyticsRepository.save(clickEvent);
    }

    async getShortlinkAnalytics(
        userId: string,
        shortCode: string,
        limit?: number,
        offset?: number,
    ): Promise<ShortlinkAnalyticsResponseDto> {
        await this.assertProUser(userId);

        const safeLimit = this.resolveLimit(limit);
        const safeOffset = this.resolveOffset(offset);

        const whereClause = {
            ownerUserId: userId,
            shortCode: shortCode,
        };

        const [totalClicks, clickHistory] = await Promise.all([
            this.analyticsRepository.count({ where: whereClause }),
            this.analyticsRepository.find({
                where: whereClause,
                order: { clickedAt: 'DESC' },
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        return {
            short_code: shortCode,
            total_clicks: totalClicks,
            history: clickHistory.map((item) => ({
                timestamp: item.clickedAt.toISOString(),
                ip_address: item.ipAddress,
                user_agent: item.userAgent,
            })),
            pagination: {
                limit: safeLimit,
                offset: safeOffset,
            },
        };
    }

    private resolveLimit(limit?: number): number {
        if (!limit) {
            return AnalyticsService.DEFAULT_LIMIT;
        }

        return Math.min(limit, AnalyticsService.MAX_LIMIT);
    }

    private resolveOffset(offset?: number): number {
        if (!offset) {
            return 0;
        }

        return Math.max(offset, 0);
    }

    private async assertProUser(userId: string): Promise<void> {
        let userSubscription:
            | {
                  userId: string;
                  subscriptionType: SubscriptionType;
              }
            | undefined;

        try {
            userSubscription = await firstValueFrom(
                this.usersClient.send<{
                    userId: string;
                    subscriptionType: SubscriptionType;
                }>(
                    { cmd: 'get_user_subscription_type' },
                    {
                        userId,
                    },
                ),
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);

            if (message.includes('User not found')) {
                throw new NotFoundException('User not found.');
            }

            throw error;
        }

        if (
            !userSubscription ||
            userSubscription.subscriptionType !== SubscriptionType.PRO
        ) {
            throw new ForbiddenException(
                'Analytics are available for Pro users only.',
            );
        }
    }
}
