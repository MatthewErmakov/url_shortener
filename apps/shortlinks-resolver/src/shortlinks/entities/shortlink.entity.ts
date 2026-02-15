import { User } from 'apps/users/src/users/entities/users.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

@Entity({ name: 'shortlinks' })
export class ShortLink {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Index()
    @Column({ name: 'user_id' })
    userId: string;

    @Index({ unique: true })
    @Column({ name: 'shortcode', length: 8 })
    shortCode: string;

    @Column({ name: 'original_url', type: 'text' })
    originalUrl: string;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt?: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
