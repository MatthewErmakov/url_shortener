import { ShortLink } from 'apps/shortlinks-resolver/src/shortlinks/entities/shortlink.entity';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column({ name: 'x_api_key' })
    @IsNotEmpty()
    @IsString()
    @Matches(/^usr_[a-zA-Z0-9]{56}$/)
    xApiKey: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
