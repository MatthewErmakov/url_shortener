import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'analytics' })
export class Analytics {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    clicks: number;

    @Column()
    date: Date;
}
