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
import { Repository } from 'typeorm';
import { JwtPayload } from '@libs/auth-jwt';
import crypto from 'crypto';

@Injectable()
export class ShortlinksService {
    constructor(
        @InjectRepository(ShortLink)
        private readonly shortLinkRepo: Repository<ShortLink>,
    ) {}

    async create(
        user: JwtPayload,
        createShortlinkDto: CreateShortlinkDto,
    ): Promise<ShortLink> {
        let payload = {
            userId: user.sub,
            ...createShortlinkDto,
        };
        /**
         * FIXME: integrate "QUOTA" service in here
         */
        const isUserProSubscriber = false;

        const shortCodeRequested = payload.shortCode?.trim();

        if (shortCodeRequested) {
            if (!isUserProSubscriber) {
                throw new ForbiddenException(
                    'Custom short codes are available for Pro users',
                );
            }

            const exists = await this.shortLinkRepo.exists({
                where: { shortCode: shortCodeRequested },
            });

            if (exists) {
                throw new ConflictException('Shortcode already taken.');
            }

            const shortLink = await this.shortLinkRepo.create({
                userId: user.sub,
                originalUrl: createShortlinkDto.originalUrl,
                shortCode: crypto.randomBytes(6).toString('hex'), // 32 random symbols
                expiresAt: createShortlinkDto.expiresAt,
            });

            return await this.shortLinkRepo.save(shortLink);
        }

        const shortLink = await this.shortLinkRepo.create({
            userId: user.sub,
            originalUrl: createShortlinkDto.originalUrl,
            shortCode: crypto.randomBytes(6).toString('hex'), // 32 random symbols
            expiresAt: createShortlinkDto.expiresAt,
        });

        return await this.shortLinkRepo.save(shortLink);
    }

    findAll() {
        return `This action returns all shortlinks`;
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
}
