
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProviderFactory } from './ai.factory';
import { Project } from '../governance/entities/project.entity';
import { ProjectsModule } from '../governance/projects/projects.module';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project]),
        ProjectsModule,
        AnalysisModule
    ],
    controllers: [AiController],
    providers: [AiService, AiProviderFactory],
    exports: [AiService]
})
export class AiModule { }
