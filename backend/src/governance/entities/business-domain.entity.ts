import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class BusinessDomain {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string; // e.g., "Finance", "HR"

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    owner: string; // e.g., "Team A"

    @Column({ nullable: true })
    projectId: string;

    @ManyToOne(() => Project, (project) => project.domains)
    project: Project;

    @CreateDateColumn()
    createdAt: Date;
}
