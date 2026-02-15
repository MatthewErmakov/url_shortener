import { Expose } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class AuthorizedDTO {
    @IsEmail()
    email: string;

    @Expose({ name: 'x_api_key' })
    @IsString()
    xApiKey: string;
}
