import { IsDateString, IsInt, IsString, MaxLength } from 'class-validator';

export class ShortlinkCreatedEventDto {
    @IsInt()
    shortlinkId: number;

    @IsString()
    ownerUserId: string;

    @IsString()
    @MaxLength(8)
    shortCode: string;

    @IsDateString()
    createdAt: string;

    @IsDateString()
    updatedAt: string;
}
