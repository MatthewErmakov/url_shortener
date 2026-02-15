import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'click_history' })
export class Analytics {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'shortlink_id', type: 'int' })
    shortlinkId: number;

    @Column({ name: 'short_code', type: 'varchar', length: 8 })
    shortCode: string;

    @Column({ name: 'owner_user_id', type: 'varchar' })
    ownerUserId: string;

    @Column({ name: 'ip_address', type: 'text' })
    ipAddress: string;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string | null;

    @Column({ name: 'clicked_at', type: 'timestamptz' })
    clickedAt: Date;
}
