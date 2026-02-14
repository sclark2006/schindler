
import { Controller, Post, Body, UseGuards, Param, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { ProjectsService } from '../governance/projects/projects.service';
import { AnalysisService } from '../analysis/analysis.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        private aiService: AiService,
        private projectsService: ProjectsService,
        private analysisService: AnalysisService
    ) { }

    @Put('config/:projectId')
    async updateConfig(@Param('projectId') projectId: string, @Body() config: any) {
        return this.projectsService.updateAiConfig(projectId, config);
    }

    @Post('summary/:projectId')
    async generateSummary(@Param('projectId') projectId: string, @Body() data: { analysisId: string;[key: string]: any }) {
        const summary = await this.aiService.generateSummary(projectId, data);
        if (data.analysisId) {
            await this.analysisService.updateSummary(data.analysisId, summary);
        }
        return { summary };
    }

    @Post('explain/:projectId')
    async explainCode(@Param('projectId') projectId: string, @Body() body: { code: string }) {
        const explanation = await this.aiService.explainCode(projectId, body.code);
        return { explanation };
    }
    @Post('generate')
    async generate(@Body() body: { projectId: string; prompt: string }) {
        if (!body.projectId || !body.prompt) {
            throw new Error('Missing projectId or prompt');
        }
        const text = await this.aiService.generateResponse(body.projectId, body.prompt);
        return { text };
    }
}
