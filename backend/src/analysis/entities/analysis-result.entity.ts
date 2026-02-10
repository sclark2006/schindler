import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

    @Column('decimal', { precision: 10, scale: 2 })
    complexityScore: number;

    @Column()
    complexityLevel: string;

    @CreateDateColumn()
    createdAt: Date;
}
