import { DataSource } from 'typeorm';
import { AnalysisResult } from './src/analysis/entities/analysis-result.entity';
import { DiscoveredService } from './src/governance/entities/discovered-service.entity';
import { BusinessDomain } from './src/governance/entities/business-domain.entity';
import { MigrationRule } from './src/governance/entities/migration-rule.entity';
import { SystemConfig } from './src/governance/entities/system-config.entity';
import { Project } from './src/governance/entities/project.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'schindler',
    password: process.env.DATABASE_PASSWORD || 'password123',
    database: process.env.DATABASE_NAME || 'schindler_db',
    entities: [AnalysisResult, DiscoveredService, BusinessDomain, MigrationRule, SystemConfig, Project],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
});
