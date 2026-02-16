import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'shortlinks_reflection' })
@Index('idx_shortlinks_reflection_owner_shortcode', ['ownerUserId', 'shortCode'])
export class ShortlinkReflection {
    @PrimaryColumn({ name: 'shortlink_id', type: 'int' })
    shortlinkId: number;

    @Column({ name: 'owner_user_id', type: 'varchar' })
    ownerUserId: string;

    @Column({ name: 'short_code', type: 'varchar', length: 8 })
    shortCode: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
