import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AnalysisResult } from '../../analysis/entities/analysis-result.entity';

@Entity()
export class Recommendation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    blockName: string;

    @Column()
    serviceName: string;

    @Column()
    method: string;

    @Column()
    url: string;

    @Column('text')
    description: string;

    @Column('text', { nullable: true })
    originalDescription: string;

    @Column({ nullable: true })
    ticketId: string;

    @Column({ nullable: true })
    ticketUrl: string;

    @Column({ default: 'PROPOSED' }) // PROPOSED, ACCEPTED, REJECTED, COMPLETED
    status: string;

    @ManyToOne(() => AnalysisResult, (analysis) => analysis.recommendations, { onDelete: 'CASCADE' })
    analysisResult: AnalysisResult;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
