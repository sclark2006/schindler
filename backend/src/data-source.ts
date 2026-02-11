import { DataSource } from 'typeorm';
import { AnalysisResult } from './analysis/entities/analysis-result.entity';
import { DiscoveredService } from './governance/entities/discovered-service.entity';
import { BusinessDomain } from './governance/entities/business-domain.entity';
import { MigrationRule } from './governance/entities/migration-rule.entity';
import { SystemConfig } from './governance/entities/system-config.entity';
import { Project } from './governance/entities/project.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost', // Default to localhost for CLI usage outside docker
    port: parseInt(process.env.DATABASE_PORT || '5433'),
    username: process.env.DATABASE_USER || 'schindler',
    password: process.env.DATABASE_PASSWORD || 'password123',
    database: process.env.DATABASE_NAME || 'schindler_db',
    synchronize: false,
    logging: true,
    entities: [AnalysisResult, DiscoveredService, BusinessDomain, MigrationRule, SystemConfig, Project],
    migrations: [path.join(__dirname, '/migrations/*.ts')],
    subscribers: [],
});
