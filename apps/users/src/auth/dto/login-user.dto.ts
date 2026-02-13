import { PartialType } from '@nestjs/mapped-types';
import { RegisterUser } from './register-user.dto';

export class LoginUser extends PartialType(RegisterUser) {
    password: string;
}
