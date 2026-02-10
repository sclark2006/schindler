import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class BusinessDomain {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string; // e.g., "Finance", "HR"

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    owner: string; // e.g., "Team A"

    @CreateDateColumn()
    createdAt: Date;
}
