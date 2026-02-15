import {
    Inject,
    Injectable,
    NotFoundException,
    Redirect,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortLink } from './shortlinks/entities/shortlink.entity';

@Injectable()
export class AppService {
    constructor(
        @InjectRepository(ShortLink)
        private readonly shortLinkRepo: Repository<ShortLink>,
    ) {}

    async redirectTo(shortCode: string) {
        const shortLink = await this.shortLinkRepo.findOne({
            where: { shortCode: shortCode },
            select: ['originalUrl', 'expiresAt'],
        });

        /**
         * Instead of 410 code use 404 for safety purposes
         */
        if (
            shortLink &&
            shortLink.expiresAt &&
            shortLink.expiresAt < new Date()
        ) {
            throw new NotFoundException('Shortcode not defined.');
        }

        return {
            url: shortLink?.originalUrl ?? '',
            statusCode: 301,
        };
    }
}
