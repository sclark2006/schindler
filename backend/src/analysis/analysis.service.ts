import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisResult } from './entities/analysis-result.entity';
import * as crypto from 'crypto';
import { IAnalysisAdapter } from './interfaces/analysis.adapter.interface';
import { FormsXmlAdapter } from './adapters/forms-xml.adapter';

@Injectable()
export class AnalysisService {
    private adapter: IAnalysisAdapter;

    constructor(
        @InjectRepository(AnalysisResult)
        private analysisRepository: Repository<AnalysisResult>,
    ) {
        // In the future this could be injected or selected based on file type
        this.adapter = new FormsXmlAdapter();
    }

    async analyzeXml(xmlContent: string, projectId: string): Promise<AnalysisResult> {
        try {
            if (!this.adapter.validate(xmlContent)) {
                throw new Error('Invalid XML structure or unsupported format');
            }

            const data = await this.adapter.parse(xmlContent);

            // Calculate Complexity Score (Generic logic)
            // (Triggers * 5) + (PUs * 10) + (LOC / 10)
            const stats = data.stats;
            const complexityScore = (stats.totalTriggers * 5) + (stats.totalProgramUnits * 10) + (stats.totalLoc / 10);

            let complexityLevel = 'Baja';
            if (complexityScore > 500) complexityLevel = 'Muy Alta';
            else if (complexityScore > 200) complexityLevel = 'Alta';
            else if (complexityScore > 100) complexityLevel = 'Media';

            // Hash to detect duplicates
            const hash = crypto.createHash('sha256').update(xmlContent).digest('hex');

            // Create new Analysis Result
            const result = new AnalysisResult();
            result.moduleName = data.moduleName;
            result.originalXmlHash = hash;
            result.complexityScore = complexityScore;
            result.complexityLevel = complexityLevel;
            result.projectId = projectId;

            // Store the raw parsed data
            result.parsedData = data;

            // Save to DB
            await this.analysisRepository.save(result);

            return result;

        } catch (error) {
            throw new BadRequestException('Failed to analyze content: ' + error.message);
        }
    }

    async findAllByProject(projectId: string): Promise<AnalysisResult[]> {
        return this.analysisRepository.find({
            where: { projectId },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<AnalysisResult> {
        return this.analysisRepository.findOne({ where: { id } });
    }

    async delete(id: string): Promise<void> {
        await this.analysisRepository.delete(id);
    }

    async updateSummary(id: string, summary: string): Promise<AnalysisResult> {
        const analysis = await this.analysisRepository.findOne({ where: { id } });
        if (!analysis) throw new Error('Analysis not found');
        analysis.summary = summary;
        return this.analysisRepository.save(analysis);
    }
}
