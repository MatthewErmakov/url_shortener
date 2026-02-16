import { IsInt, IsString, MaxLength } from 'class-validator';

export class ShortlinkDeletedEventDto {
    @IsInt()
    shortlinkId: number;

    @IsString()
    ownerUserId: string;

    @IsString()
    @MaxLength(8)
    shortCode: string;
}
