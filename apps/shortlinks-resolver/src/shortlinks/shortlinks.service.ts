import {
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
import crypto from 'crypto';

@Injectable()
export class ShortlinksService {
    private static readonly NON_PRO_MONTHLY_LIMIT = 10;
    private static readonly PRO_MONTHLY_LIMIT = 100;

    constructor(
        @InjectRepository(ShortLink)
        private readonly shortLinkRepo: Repository<ShortLink>,
    ) {}

    async createOne(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto,
    ): Promise<ShortLink> {
        const [created] = await this.createWithMonthlyLimit(user, [
            createShortlinkDto,
        ]);
        return created;
    }

    async createMany(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto[],
    ): Promise<ShortLink[]> {
        return this.createWithMonthlyLimit(user, createShortlinkDto);
    }

    findAll(user: JwtPayload) {
        return this.shortLinkRepo.find({
            where: {
                userId: user.sub,
            },
        });
    }

    async findOne(user: JwtPayload, shortCode: string): Promise<ShortLink> {
        try {
            return await this.shortLinkRepo.findOneOrFail({
                where: {
                    userId: user.sub,
                    shortCode: shortCode,
                },
            });
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

    private async isUserProSubscriber(user: JwtPayload): Promise<boolean> {
        /**
         * FIXME: integrate "QUOTA" service in here
         */
        return false;
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
    ): Promise<ShortLink[]> {
        const userId = user.sub;
        const lockKey = Number(user.sub);
        const dtos = createShortlinkDto;

        return this.shortLinkRepo.manager.transaction(async (manager) => {
            // protect from race condition
            await manager.query('SELECT pg_advisory_xact_lock($1::bigint)', [
                lockKey,
            ]);

            const txRepo = manager.getRepository(ShortLink);
            const isProSubscriber = await this.isUserProSubscriber(user);
            const monthlyLimit = isProSubscriber
                ? ShortlinksService.PRO_MONTHLY_LIMIT
                : ShortlinksService.NON_PRO_MONTHLY_LIMIT;
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

            const shortLinks: ShortLink[] = [];

            for (const dto of dtos) {
                const shortCodeRequested = dto.shortCode?.trim();

                if (shortCodeRequested && !isProSubscriber) {
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
                    expiresAt: dto.expiresAt,
                });

                shortLinks.push(await txRepo.save(shortLink));
            }

            return shortLinks;
        });
    }
}
