import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, UseGuards, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalysisService } from './analysis.service';
import { Express } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('projectId') projectId: string) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // If no projectId provided, try to use default
        // For now, let's make it optional and default to the hardcoded default Project ID if missing, 
        // or throw error if strict. Given legacy context, we'll default if missing.
        const effectiveProjectId = projectId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

        const xmlContent = file.buffer.toString('utf-8');
        return this.analysisService.analyzeXml(xmlContent, effectiveProjectId);
    }
}
