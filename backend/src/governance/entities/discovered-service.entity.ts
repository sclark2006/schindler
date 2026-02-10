import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class DiscoveredService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    originalName: string; // e.g., "RG_STATES"

    @Column()
    sourceType: string; // 'RECORD_GROUP', 'PROGRAM_UNIT', 'TRIGGER'

    @Column({ nullable: true })
    proposedServiceName: string; // e.g., "get-states-api"

    @Column({ default: 'PENDING' })
    status: string; // 'PENDING', 'APPROVED', 'MIGRATED', 'REJECTED'

    @Column({ nullable: true })
    complexity: string; // 'Low', 'Medium', 'High'

    @Column('text', { nullable: true })
    sqlLogic: string; // The extracted SQL or Code

    @CreateDateColumn()
    createdAt: Date;
}
