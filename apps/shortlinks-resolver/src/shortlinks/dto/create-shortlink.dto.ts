import { Expose } from 'class-transformer';
import {
    IsDateString,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
} from 'class-validator';
import { IsNull } from 'typeorm';

export class CreateShortlinkDto {
    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9_-]{3,32}$/)
    @Expose({ name: 'shortcode' })
    @MaxLength(8)
    shortCode: string;

    @IsUrl()
    @Expose({ name: 'original_url' })
    originalUrl: string;

    @IsOptional()
    @IsDateString()
    @Expose({ name: 'expires_at' })
    expiresAt?: string;
}
