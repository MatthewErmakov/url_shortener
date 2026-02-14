import { Expose } from 'class-transformer';
import { IsEmpty, IsNotEmpty } from 'class-validator';

export class MeDTO {
    @Expose({ name: 'x-api-key' })
    @IsNotEmpty()
    xApiKey: string;
}
