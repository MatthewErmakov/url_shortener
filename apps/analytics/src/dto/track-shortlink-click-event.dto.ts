import {
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class TrackShortlinkClickEventDto {
    @IsInt()
    shortlinkId: number;

    @IsString()
    @MaxLength(8)
    shortCode: string;

    @IsString()
    ownerUserId: string;

    @IsDateString()
    clickedAt: string;

    @IsString()
    ipAddress: string;

    @IsOptional()
    @IsString()
    userAgent: string | null;
}
