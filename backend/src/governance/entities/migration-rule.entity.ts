import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class MigrationRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    patternName: string; // e.g. "Create_Record_Group", "Complex_Cursor"

    @Column('text')
    ticketTemplate: string; // Markdown/Text template for Azure DevOps

    @Column()
    targetLayer: string; // "Backend API", "Frontend Component", "Database"

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
