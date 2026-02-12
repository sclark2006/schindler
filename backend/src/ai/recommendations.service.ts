import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { AnalysisResult } from '../analysis/entities/analysis-result.entity';

@Injectable()
export class RecommendationsService {
    constructor(
        @InjectRepository(Recommendation)
        private repo: Repository<Recommendation>,
        @InjectRepository(AnalysisResult)
        private analysisRepo: Repository<AnalysisResult>,
    ) { }

    async findAll(analysisId: string, blockName?: string): Promise<Recommendation[]> {
        const where: any = { analysisResult: { id: analysisId } };
        if (blockName) {
            where.blockName = blockName;
        }
        return this.repo.find({ where, order: { createdAt: 'DESC' } });
    }

    async createOrUpdate(analysisId: string, data: Partial<Recommendation>[]): Promise<Recommendation[]> {
        const analysis = await this.analysisRepo.findOne({ where: { id: analysisId } });
        if (!analysis) throw new NotFoundException('Analysis not found');

        const saved: Recommendation[] = [];

        for (const item of data) {
            let rec = await this.repo.findOne({
                where: {
                    analysisResult: { id: analysisId },
                    blockName: item.blockName,
                    serviceName: item.serviceName,
                    method: item.method,
                    url: item.url
                }
            });

            if (rec) {
                // Update existing
                rec.description = item.description;
                if (item.status) rec.status = item.status;
            } else {
                // Create new
                rec = this.repo.create({
                    ...item,
                    analysisResult: analysis
                });
            }

            saved.push(await this.repo.save(rec));
        }

        return saved;
    }

    async update(id: string, updateData: Partial<Recommendation>): Promise<Recommendation> {
        const rec = await this.repo.findOne({ where: { id } });
        if (!rec) throw new NotFoundException('Recommendation not found');

        Object.assign(rec, updateData);
        return this.repo.save(rec);
    }
}
