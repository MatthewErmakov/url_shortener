import {
    IsEmail,
    IsNotEmpty,
    IsStrongPassword,
    maxLength,
    minLength,
} from 'class-validator';

export class CreateUserDTO {
    @IsEmail()
    email: string;

    @IsStrongPassword({
        minLength: 8,
        minNumbers: 2,
        minSymbols: 1,
    })
    password: string;
}
