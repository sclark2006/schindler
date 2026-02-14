import { Entity, Column, PrimaryColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class SystemConfig {
    @PrimaryColumn()
    key: string; // e.g., 'ADO_ORG_URL', 'ADO_PAT'

    @Column()
    value: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: false })
    isSecret: boolean; // If true, value should be masked in UI

    @Column({ default: 'DEV' })
    environment: string; // 'DEV', 'QA', 'PROD'

    @UpdateDateColumn()
    updatedAt: Date;

    @PrimaryColumn({ default: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }) // Temporary default for migration
    projectId: string;

    @ManyToOne(() => Project, (project) => project.configs)
    project: Project;
}
