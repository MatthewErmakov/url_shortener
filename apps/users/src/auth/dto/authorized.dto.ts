import { IsString } from 'class-validator';

export class AuthorizedDTO {
    @IsString()
    accessToken: string;
}
