
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProviderFactory } from './ai.factory';
import { Project } from '../governance/entities/project.entity';
import { Recommendation } from './entities/recommendation.entity';
import { AnalysisResult } from '../analysis/entities/analysis-result.entity';
import { ProjectsModule } from '../governance/projects/projects.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { RecommendationsService } from './recommendations.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, Recommendation, AnalysisResult]),
        ProjectsModule,
        AnalysisModule
    ],
    controllers: [AiController],
    providers: [AiService, AiProviderFactory, RecommendationsService],
    exports: [AiService, RecommendationsService]
})
export class AiModule { }
