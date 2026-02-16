export type ShortLinkResponse = {
    shortCode: string;
    originalUrl: string;
    expiresAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    shortenedUrl: string;
};

export class PaginatedShortlinksResponseDto {
    data: ShortLinkResponse[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}
