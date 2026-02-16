import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateShortlinkDto } from './dto/create-shortlink.dto';
import { UpdateShortlinkDto } from './dto/update-shortlink.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShortLink } from './entities/shortlink.entity';
import {
    And,
    LessThan,
    MoreThanOrEqual,
    Not,
    Repository,
} from 'typeorm';
import { JwtPayload } from '@libs/auth-jwt';
import { SubscriptionType } from '@libs/shared';
import crypto from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
    PaginatedShortlinksResponseDto,
    ShortLinkResponse,
} from './dto/paginated-shortlinks-response.dto';

@Injectable()
export class ShortlinksService {
    private static readonly DEFAULT_LIMIT = 50;
    private static readonly MAX_LIMIT = 200;

    private static readonly MONTHLY_LIMIT_BY_SUBSCRIPTION: Record<
        SubscriptionType,
        number
    > = {
        [SubscriptionType.FREE]: 10,
        [SubscriptionType.PRO]: 100,
    };

    constructor(
        @Inject('USERS_SERVICE')
        private readonly usersClient: ClientProxy,

        @Inject('ANALYTICS_SERVICE')
        private readonly analyticsClient: ClientProxy,

        @InjectRepository(ShortLink)
        private readonly shortLinkRepo: Repository<ShortLink>,
    ) {}

    async createOne(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto,
    ): Promise<ShortLinkResponse> {
        const [created] = await this.createWithMonthlyLimit(user, [
            createShortlinkDto,
        ]);

        this.emitShortlinkCreatedEvent(created);
        return created;
    }

    async createMany(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto[],
    ): Promise<ShortLinkResponse[]> {
        const createdShortlinks = await this.createWithMonthlyLimit(
            user,
            createShortlinkDto,
        );

        createdShortlinks.forEach((shortlink) => {
            this.emitShortlinkCreatedEvent(shortlink);
        });

        return createdShortlinks;
    }

    async findAll(
        user: JwtPayload,
        limit?: number,
        offset?: number,
    ): Promise<PaginatedShortlinksResponseDto> {
        const safeLimit = this.resolveLimit(limit);
        const safeOffset = this.resolveOffset(offset);

        const [total, shortLinks] = await Promise.all([
            this.shortLinkRepo.count({
                where: {
                    userId: user.sub,
                },
            }),
            this.shortLinkRepo.find({
                where: {
                    userId: user.sub,
                },
                order: {
                    createdAt: 'DESC',
                },
                take: safeLimit,
                skip: safeOffset,
            }),
        ]);

        return {
            data: shortLinks.map((shortLink) => ({
                ...shortLink,
                shortenedUrl: this.buildShortenedUrl(shortLink.shortCode),
            })),
            pagination: {
                limit: safeLimit,
                offset: safeOffset,
                total,
            },
        };
    }

    async findOne(
        user: JwtPayload,
        shortCode: string,
    ): Promise<ShortLinkResponse> {
        try {
            const shortLink = await this.shortLinkRepo.findOneOrFail({
                where: {
                    userId: user.sub,
                    shortCode: shortCode,
                },
            });

            return {
                ...shortLink,
                shortenedUrl: this.buildShortenedUrl(shortLink.shortCode),
            };
        } catch (error) {
            throw new NotFoundException('Shortlink not found.');
        }
    }

    async update(
        user: JwtPayload,
        id: number,
        updateShortlinkDto: UpdateShortlinkDto,
    ): Promise<ShortLinkResponse> {
        const shortLink = await this.shortLinkRepo.findOne({
            where: {
                id,
                userId: user.sub,
            },
        });

        if (!shortLink) {
            throw new NotFoundException('Shortlink not found.');
        }

        const hasAnyPatchField =
            updateShortlinkDto.originalUrl !== undefined ||
            updateShortlinkDto.expiresAt !== undefined ||
            updateShortlinkDto.shortCode !== undefined;

        if (!hasAnyPatchField) {
            return this.toShortLinkResponse(shortLink);
        }

        if (updateShortlinkDto.originalUrl !== undefined) {
            shortLink.originalUrl = updateShortlinkDto.originalUrl;
        }

        if (updateShortlinkDto.expiresAt !== undefined) {
            shortLink.expiresAt = this.parseAndValidateExpiresAt(
                updateShortlinkDto.expiresAt,
            );
        }

        const shortCodeRequested = updateShortlinkDto.shortCode?.trim();
        const isShortCodeChanged =
            shortCodeRequested &&
            shortCodeRequested.length > 0 &&
            shortCodeRequested !== shortLink.shortCode;

        if (isShortCodeChanged) {
            const subscriptionType = await this.getUserSubscriptionType(user);

            if (subscriptionType !== SubscriptionType.PRO) {
                throw new ForbiddenException(
                    'Custom short codes are available for Pro users.',
                );
            }

            const exists = await this.shortLinkRepo.exists({
                where: {
                    shortCode: shortCodeRequested,
                    id: Not(id),
                },
            });

            if (exists) {
                throw new ConflictException('Shortcode already taken.');
            }

            shortLink.shortCode = shortCodeRequested;
        }

        const savedShortlink = await this.shortLinkRepo.save(shortLink);
        const response = this.toShortLinkResponse(savedShortlink);

        this.emitShortlinkUpdatedEvent(response);
        return response;
    }

    async remove(user: JwtPayload, id: number): Promise<void> {
        const shortLink = await this.shortLinkRepo.findOne({
            where: {
                id,
                userId: user.sub,
            },
        });

        if (!shortLink) {
            throw new NotFoundException('Shortlink not found.');
        }

        await this.shortLinkRepo.remove(shortLink);
        this.emitShortlinkDeletedEvent(shortLink);
    }

    private resolveLimit(limit?: number): number {
        if (!limit) {
            return ShortlinksService.DEFAULT_LIMIT;
        }

        return Math.min(limit, ShortlinksService.MAX_LIMIT);
    }

    private resolveOffset(offset?: number): number {
        if (!offset) {
            return 0;
        }

        return Math.max(offset, 0);
    }

    private async getUserSubscriptionType(
        user: JwtPayload,
    ): Promise<SubscriptionType> {
        return (
            await firstValueFrom(
                this.usersClient.send<{
                    userId: string;
                    subscriptionType: SubscriptionType;
                }>(
                    { cmd: 'get_user_subscription_type' },
                    {
                        userId: user.sub,
                    },
                ),
            )
        ).subscriptionType;
    }

    private getCurrentMonthUtcRange(now: Date = new Date()): {
        start: Date;
        end: Date;
    } {
        const start = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
        );
        const end = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth() + 1,
                1,
                0,
                0,
                0,
                0,
            ),
        );

        return { start, end };
    }

    private async createWithMonthlyLimit(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto[],
    ): Promise<ShortLinkResponse[]> {
        const userId = user.sub;
        const lockKey = Number(user.sub);
        const dtos = createShortlinkDto;

        return this.shortLinkRepo.manager.transaction(async (manager) => {
            // protect from race condition
            await manager.query('SELECT pg_advisory_xact_lock($1::bigint)', [
                lockKey,
            ]);

            const txRepo = manager.getRepository(ShortLink);
            const subscriptionType = await this.getUserSubscriptionType(user);
            const monthlyLimit =
                ShortlinksService.MONTHLY_LIMIT_BY_SUBSCRIPTION[
                    subscriptionType
                ];
            const { start, end } = this.getCurrentMonthUtcRange();

            const monthlyCreatedCount = await txRepo.count({
                where: {
                    userId,
                    createdAt: And(MoreThanOrEqual(start), LessThan(end)),
                },
            });

            if (monthlyCreatedCount + dtos.length > monthlyLimit) {
                throw new ForbiddenException(
                    `Monthly shortlinks limit reached (${monthlyLimit}).`,
                );
            }

            const shortLinks: ShortLinkResponse[] = [];

            for (const dto of dtos) {
                const shortCodeRequested = dto.shortCode?.trim();
                const expiresAt = this.parseAndValidateExpiresAt(dto.expiresAt);

                if (
                    shortCodeRequested &&
                    subscriptionType !== SubscriptionType.PRO
                ) {
                    throw new ForbiddenException(
                        'Custom short codes are available for Pro users.',
                    );
                }

                if (shortCodeRequested) {
                    const exists = await txRepo.exists({
                        where: { shortCode: shortCodeRequested },
                    });

                    if (exists) {
                        throw new ConflictException('Shortcode already taken.');
                    }
                }

                const shortLink = txRepo.create({
                    userId: userId,
                    originalUrl: dto.originalUrl,
                    shortCode:
                        shortCodeRequested ??
                        crypto.randomBytes(4).toString('hex'),
                    expiresAt,
                });

                const savedShortLink = await txRepo.save(shortLink);

                shortLinks.push(this.toShortLinkResponse(savedShortLink));
            }

            return shortLinks;
        });
    }

    private toShortLinkResponse(shortLink: ShortLink): ShortLinkResponse {
        return {
            ...shortLink,
            shortenedUrl: this.buildShortenedUrl(shortLink.shortCode),
        };
    }

    private emitShortlinkCreatedEvent(shortlink: ShortLinkResponse): void {
        this.analyticsClient
            .emit(
                { cmd: 'shortlink_created' },
                {
                    shortlinkId: shortlink.id,
                    ownerUserId: shortlink.userId,
                    shortCode: shortlink.shortCode,
                    createdAt: shortlink.createdAt.toISOString(),
                    updatedAt: shortlink.updatedAt.toISOString(),
                },
            )
            .subscribe({
                error: (error) => {
                    console.error(
                        '[ShortlinksService] Failed to emit shortlink_created event',
                        error,
                    );
                },
            });
    }

    private emitShortlinkUpdatedEvent(shortlink: ShortLinkResponse): void {
        this.analyticsClient
            .emit(
                { cmd: 'shortlink_updated' },
                {
                    shortlinkId: shortlink.id,
                    ownerUserId: shortlink.userId,
                    shortCode: shortlink.shortCode,
                    createdAt: shortlink.createdAt.toISOString(),
                    updatedAt: shortlink.updatedAt.toISOString(),
                },
            )
            .subscribe({
                error: (error) => {
                    console.error(
                        '[ShortlinksService] Failed to emit shortlink_updated event',
                        error,
                    );
                },
            });
    }

    private emitShortlinkDeletedEvent(shortlink: ShortLink): void {
        this.analyticsClient
            .emit(
                { cmd: 'shortlink_deleted' },
                {
                    shortlinkId: shortlink.id,
                    ownerUserId: shortlink.userId,
                    shortCode: shortlink.shortCode,
                },
            )
            .subscribe({
                error: (error) => {
                    console.error(
                        '[ShortlinksService] Failed to emit shortlink_deleted event',
                        error,
                    );
                },
            });
    }

    private buildShortenedUrl(shortCode: string): string {
        return `${this.getShortlinksBaseUrl()}/r/${shortCode}`;
    }

    private getShortlinksBaseUrl(): string {
        const publicBaseUrl =
            process.env.SHORTLINKS_RESOLVER_PUBLIC_BASE_URL?.trim();

        if (publicBaseUrl) {
            return publicBaseUrl.replace(/\/+$/, '');
        }

        const host = process.env.SHORTLINKS_RESOLVER_HOST ?? 'localhost';
        const httpPort = process.env.SHORTLINKS_RESOLVER_HTTP_PORT ?? '3004';

        return `http://${host}:${httpPort}`;
    }

    private parseAndValidateExpiresAt(expiresAt?: string): Date | null {
        if (!expiresAt) {
            return null;
        }

        const expiresAtDate = new Date(expiresAt);

        if (Number.isNaN(expiresAtDate.getTime())) {
            throw new BadRequestException('Invalid expiresAt value.');
        }

        if (expiresAtDate <= new Date()) {
            throw new BadRequestException(
                'expiresAt must be a future date/time.',
            );
        }

        return expiresAtDate;
    }
}
