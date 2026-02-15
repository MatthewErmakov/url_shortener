import { ShortLink } from 'apps/shortlinks-resolver/src/shortlinks/entities/shortlink.entity';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { SubscriptionType } from '@libs/shared';
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

    @Column({
        name: 'subcription_type',
        type: 'enum',
        enum: SubscriptionType,
        enumName: 'users_subscription_type_enum',
        default: SubscriptionType.FREE,
    })
    subscriptionType: SubscriptionType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
