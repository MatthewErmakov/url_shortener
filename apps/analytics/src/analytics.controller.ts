import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiKeyGuard } from '@libs/auth-jwt';
import type { AuthenticatedRequest } from '@libs/auth-jwt/interfaces/authenticated-request.interface';
import { TrackShortlinkClickEventDto } from './dto/track-shortlink-click-event.dto';
import { GetShortlinkAnalyticsQueryDto } from './dto/get-shortlink-analytics-query.dto';
import { ShortlinkAnalyticsResponseDto } from './dto/shortlink-analytics-response.dto';
import { ShortlinkCreatedEventDto } from './dto/shortlink-created-event.dto';
import { ShortlinkUpdatedEventDto } from './dto/shortlink-updated-event.dto';
import { ShortlinkDeletedEventDto } from './dto/shortlink-deleted-event.dto';

@Controller()
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @EventPattern({ cmd: 'track_shortlink_click' })
    async trackShortlinkClick(
        @Payload() payload: TrackShortlinkClickEventDto,
    ): Promise<void> {
        await this.analyticsService.recordClick(payload);
    }

    @EventPattern({ cmd: 'shortlink_created' })
    async trackShortlinkCreated(
        @Payload() payload: ShortlinkCreatedEventDto,
    ): Promise<void> {
        await this.analyticsService.upsertShortlinkReflection(payload);
    }

    @EventPattern({ cmd: 'shortlink_updated' })
    async trackShortlinkUpdated(
        @Payload() payload: ShortlinkUpdatedEventDto,
    ): Promise<void> {
        await this.analyticsService.upsertShortlinkReflection(payload);
    }

    @EventPattern({ cmd: 'shortlink_deleted' })
    async trackShortlinkDeleted(
        @Payload() payload: ShortlinkDeletedEventDto,
    ): Promise<void> {
        await this.analyticsService.deleteShortlinkReflection(payload);
    }

    @UseGuards(ApiKeyGuard)
    @Get('shortlinks/:shortCode')
    async getShortlinkAnalytics(
        @Req() req: AuthenticatedRequest,
        @Param('shortCode') shortCode: string,
        @Query() query: GetShortlinkAnalyticsQueryDto,
    ): Promise<ShortlinkAnalyticsResponseDto> {
        return this.analyticsService.getShortlinkAnalytics(
            req.user.sub,
            shortCode,
            query.limit,
            query.offset,
        );
    }
}
