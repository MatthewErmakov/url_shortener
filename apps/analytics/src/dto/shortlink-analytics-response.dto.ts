export class ShortlinkAnalyticsHistoryItemDto {
    timestamp: string;
    ip_address: string;
    user_agent: string | null;
}

export class ShortlinkAnalyticsResponseDto {
    shortcode: string;
    total_clicks: number;
    history: ShortlinkAnalyticsHistoryItemDto[];
    pagination: {
        limit: number;
        offset: number;
    };
}
