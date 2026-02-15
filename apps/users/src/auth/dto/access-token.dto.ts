import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AccessTokenDTO {
    accessToken: string;
}
