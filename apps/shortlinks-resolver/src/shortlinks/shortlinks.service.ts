import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateShortlinkDto } from './dto/create-shortlink.dto';
import { UpdateShortlinkDto } from './dto/update-shortlink.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShortLink } from './entities/shortlink.entity';
import { And, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { JwtPayload } from '@libs/auth-jwt';
import { SubscriptionType } from '@libs/shared';
import crypto from 'crypto';

type ShortLinkResponse = ShortLink & { shortenedUrl: string };

@Injectable()
export class ShortlinksService {
    /**
     * FIXME: by moving to QUOTA service
     */
    private static readonly MONTHLY_LIMIT_BY_SUBSCRIPTION: Record<
        SubscriptionType,
        number
    > = {
        [SubscriptionType.FREE]: 10,
        [SubscriptionType.PRO]: 100,
    };

    constructor(
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
        return created;
    }

    async createMany(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto[],
    ): Promise<ShortLinkResponse[]> {
        return this.createWithMonthlyLimit(user, createShortlinkDto);
    }

    async findAll(user: JwtPayload): Promise<ShortLinkResponse[]> {
        const shortLinks = await this.shortLinkRepo.find({
            where: {
                userId: user.sub,
            },
        });

        return shortLinks.map((shortLink) => ({
            ...shortLink,
            shortenedUrl: this.buildShortenedUrl(shortLink.shortCode),
        }));
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

    update(id: number, updateShortlinkDto: UpdateShortlinkDto) {
        return `This action updates a #${id} shortlink`;
    }

    remove(id: number) {
        return `This action removes a #${id} shortlink`;
    }

    private async getUserSubscriptionType(
        _user: JwtPayload,
    ): Promise<SubscriptionType> {
        /**
         * FIXME: integrate "QUOTA" service in here
         */
        return SubscriptionType.FREE;
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

                shortLinks.push({
                    ...savedShortLink,
                    shortenedUrl: this.buildShortenedUrl(
                        savedShortLink.shortCode,
                    ),
                });
            }

            return shortLinks;
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
