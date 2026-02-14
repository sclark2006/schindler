import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module';
import { GovernanceModule } from './governance/governance.module';
import { AuthModule } from './auth/auth.module';
import { AdoModule } from './integrations/ado/ado.module';
import { GitHubModule } from './integrations/github/github.module';
import { AiModule } from './ai/ai.module';
import { AnalysisResult } from './analysis/entities/analysis-result.entity';
import { DiscoveredService } from './governance/entities/discovered-service.entity';
import { BusinessDomain } from './governance/entities/business-domain.entity';
import { MigrationRule } from './governance/entities/migration-rule.entity';
import { SystemConfig } from './governance/entities/system-config.entity';
import { Project } from './governance/entities/project.entity';
import { Recommendation } from './ai/entities/recommendation.entity';

@Module({
    imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'db',
            port: parseInt(process.env.DATABASE_PORT) || 5432,
            username: process.env.DATABASE_USER || 'schindler',
            password: process.env.DATABASE_PASSWORD || 'password123',
            database: process.env.DATABASE_NAME || 'schindler_db',
            entities: [AnalysisResult, DiscoveredService, BusinessDomain, MigrationRule, SystemConfig, Project, Recommendation],
            synchronize: true, // Use migrations
            migrationsRun: true, // Auto-run migrations on startup
        }),
        AnalysisModule,
        GovernanceModule,
        AuthModule,
        AdoModule,
        GitHubModule,
        AiModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
