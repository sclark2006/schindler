import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AnalysisResult } from '../../analysis/entities/analysis-result.entity';
import { SystemConfig } from './system-config.entity';
import { DiscoveredService } from './discovered-service.entity';
import { BusinessDomain } from './business-domain.entity';

@Entity()
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => AnalysisResult, (analysis) => analysis.project)
    analyses: AnalysisResult[];

    @OneToMany(() => SystemConfig, (config) => config.project)
    configs: SystemConfig[];

    @OneToMany(() => DiscoveredService, (service) => service.project)
    discoveredServices: DiscoveredService[];

    @OneToMany(() => BusinessDomain, (domain) => domain.project)
    domains: BusinessDomain[];

    @Column({ type: 'jsonb', nullable: true })
    aiConfig: object;
}
