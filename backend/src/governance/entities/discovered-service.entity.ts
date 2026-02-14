import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class DiscoveredService {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    originalName: string; // e.g., "RG_STATES"

    @Column()
    sourceType: string; // 'RECORD_GROUP', 'PROGRAM_UNIT', 'TRIGGER', 'BLOCK'

    @Column({ nullable: true })
    method: string; // 'GET', 'POST', 'PUT', 'DELETE'

    @Column({ nullable: true })
    domain: string; // e.g., 'users', 'products'

    @Column({ nullable: true })
    endpoint: string; // Full path with version e.g., '/api/users/v1/states'

    @Column({ nullable: true })
    dataSource: string; // Original table/query name

    @Column({ nullable: true })
    dataSourceType: string; // 'TABLE', 'QUERY', 'PROCEDURE'

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

    @Column({ nullable: true })
    projectId: string;

    @ManyToOne(() => Project, (project) => project.discoveredServices)
    project: Project;

    @Column({ nullable: true })
    ticketId: string;

    @Column({ nullable: true })
    ticketUrl: string;

    @Column({ default: 'PENDING' }) // PENDING, REQUESTED, ACTIVE, COMPLETED, REJECTED
    ticketStatus: string;
}
