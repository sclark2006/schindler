
import { Controller, Post, Body, UseGuards, Param, Put, Get, Query, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { ProjectsService } from '../governance/projects/projects.service';
import { AnalysisService } from '../analysis/analysis.service';
import { RecommendationsService } from './recommendations.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        private aiService: AiService,
        private projectsService: ProjectsService,
        private analysisService: AnalysisService,
        private recommendationsService: RecommendationsService
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

    @Post('recommend/block')
    async recommendBlock(@Body() body: { projectId: string; block: any; rules: any[]; domains: any[] }) {
        const recommendations = await this.aiService.generateBlockRecommendations(body.projectId, body.block, body.rules, body.domains);
        return recommendations;
    }

    @Get('recommendations')
    async getRecommendations(@Query('analysisId') analysisId: string, @Query('blockName') blockName: string) {
        return this.recommendationsService.findAll(analysisId, blockName);
    }

    @Post('recommendations')
    async saveRecommendations(@Body() body: { analysisId: string; recommendations: any[] }) {
        return this.recommendationsService.createOrUpdate(body.analysisId, body.recommendations);
    }

    @Patch('recommendations/:id')
    async updateRecommendation(@Param('id') id: string, @Body() body: any) {
        return this.recommendationsService.update(id, body);
    }

    @Post('block-statuses')
    async getBlockStatuses(@Body() body: { analysisId: string; blockNames: string[] }) {
        return this.recommendationsService.getBlockStatuses(body.analysisId, body.blockNames);
    }

    @Put('block-status')
    async setBlockStatus(@Body() body: { analysisId: string; blockName: string; status: string }) {
        await this.recommendationsService.setBlockStatus(body.analysisId, body.blockName, body.status);
        return { success: true };
    }
}
