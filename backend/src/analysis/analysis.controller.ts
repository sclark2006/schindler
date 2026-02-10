import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, UseGuards } from '@nestjs/common';
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
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const xmlContent = file.buffer.toString('utf-8');
        return this.analysisService.analyzeXml(xmlContent);
    }
}
