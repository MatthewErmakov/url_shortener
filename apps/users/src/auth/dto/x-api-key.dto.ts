import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class XApiKeyDTO {
    @IsNotEmpty()
    @IsString()
    @Matches(/^usr_[a-zA-Z0-9]{56}$/)
    @Expose({ name: 'x-api-key' })
    xApiKey: string;
}
