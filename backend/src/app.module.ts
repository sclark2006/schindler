import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalysisModule } from './analysis/analysis.module';
import { GovernanceModule } from './governance/governance.module';
import { AuthModule } from './auth/auth.module';
import { AnalysisResult } from './analysis/entities/analysis-result.entity';
import { DiscoveredService } from './governance/entities/discovered-service.entity';
import { BusinessDomain } from './governance/entities/business-domain.entity';
import { MigrationRule } from './governance/entities/migration-rule.entity';

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
            entities: [AnalysisResult, DiscoveredService, BusinessDomain, MigrationRule],
            synchronize: true, // Auto-create tables (dev only)
        }),
        AnalysisModule,
        GovernanceModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
