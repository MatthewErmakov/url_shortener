import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShortLink } from './shortlinks/entities/shortlink.entity';
import { Request } from 'express';

type RedirectToParams = {
    shortCode: string;
    ipAddress: string;
    userAgent: string | null;
};

@Injectable()
export class AppService {
    constructor(
        @Inject('ANALYTICS_SERVICE')
        private readonly analyticsClient: ClientProxy,

        @InjectRepository(ShortLink)
        private readonly shortLinkRepo: Repository<ShortLink>,
    ) {}

    async redirectTo({
        shortCode,
        ipAddress,
        userAgent,
    }: RedirectToParams): Promise<{ url: string; statusCode: number }> {
        const shortLink = await this.shortLinkRepo.findOne({
            where: { shortCode: shortCode },
            select: ['id', 'userId', 'shortCode', 'originalUrl', 'expiresAt'],
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

        if (!shortLink) {
            throw new NotFoundException('Shortcode not defined.');
        }

        this.analyticsClient
            .emit(
                { cmd: 'track_shortlink_click' },
                {
                    shortlinkId: shortLink.id,
                    shortCode: shortLink.shortCode,
                    ownerUserId: shortLink.userId,
                    clickedAt: new Date().toISOString(),
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            )
            .subscribe({
                error: (error) => {
                    console.error(
                        '[ShortlinkResolver] Failed to emit click event',
                        error,
                    );
                },
            });

        return {
            url: shortLink.originalUrl,
            statusCode: 301,
        };
    }

    extractIpAddress(req: Request): string {
        const forwardedFor = req.headers['x-forwarded-for'];

        if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
            return forwardedFor.split(',')[0].trim();
        }

        if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
            return forwardedFor[0].split(',')[0].trim();
        }

        return req.ip ?? '';
    }

    extractUserAgent(req: Request): string | null {
        const userAgent = req.headers['user-agent'];

        if (typeof userAgent === 'string' && userAgent.trim()) {
            return userAgent;
        }

        if (Array.isArray(userAgent) && userAgent.length > 0) {
            return userAgent[0];
        }

        return null;
    }
}
