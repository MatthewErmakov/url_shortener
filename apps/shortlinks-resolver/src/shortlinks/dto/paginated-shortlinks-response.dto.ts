import { ShortLink } from '../entities/shortlink.entity';

export type ShortLinkResponse = ShortLink & { shortenedUrl: string };

export class PaginatedShortlinksResponseDto {
    data: ShortLinkResponse[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}
