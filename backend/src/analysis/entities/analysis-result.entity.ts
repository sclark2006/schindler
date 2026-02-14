import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Project } from '../../governance/entities/project.entity';
import { Recommendation } from '../../ai/entities/recommendation.entity';

@Entity()
export class AnalysisResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    moduleName: string;

    @Column('text')
    originalXmlHash: string;

    @Column('jsonb')
    parsedData: any; // Using JSONB as decided in architecture

    @Column('text', { nullable: true })
    summary: string;

    @Column('decimal', { precision: 10, scale: 2 })
    complexityScore: number;

    @Column()
    complexityLevel: string;

    @OneToMany(() => Recommendation, (rec) => rec.analysisResult)
    recommendations: Recommendation[];

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    projectId: string;

    @ManyToOne(() => Project, (project) => project.analyses)
    project: Project;
}
