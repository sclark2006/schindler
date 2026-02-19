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
        const recs = await this.repo.find({ where, order: { createdAt: 'DESC' } });

        const methodOrder: Record<string, number> = { 'GET': 1, 'POST': 2, 'PUT': 3, 'PATCH': 4, 'DELETE': 5 };

        return recs.sort((a, b) => {
            const orderA = methodOrder[a.method] || 99;
            const orderB = methodOrder[b.method] || 99;

            if (orderA !== orderB) return orderA - orderB;

            // If methods are same, sort GET by URL length (shortest first -> root resource)
            if (a.method === 'GET' && b.method === 'GET') {
                return a.url.length - b.url.length;
            }

            return 0;
        });
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

    /**
     * Compute block statuses from recommendations:
     * - Pending: no recommendations
     * - Proposed: recommendations exist but no tickets
     * - In Progress: at least one ticket created
     * - Migrated: all recommendations have status COMPLETED, or manual override
     */
    async getBlockStatuses(analysisId: string, blockNames: string[]): Promise<Record<string, string>> {
        const statuses: Record<string, string> = {};

        for (const blockName of blockNames) {
            const recs = await this.repo.find({
                where: { analysisResult: { id: analysisId }, blockName }
            });

            // Check for manual override first
            const manualOverride = recs.find(r => r.serviceName === '__MANUAL_STATUS__');
            if (manualOverride) {
                statuses[blockName] = manualOverride.status;
                continue;
            }

            if (recs.length === 0) {
                statuses[blockName] = 'Pending';
            } else {
                const allCompleted = recs.every(r => r.status === 'COMPLETED');
                const hasTickets = recs.some(r => r.ticketId);

                if (allCompleted) {
                    statuses[blockName] = 'Migrated';
                } else if (hasTickets) {
                    statuses[blockName] = 'In Progress';
                } else {
                    statuses[blockName] = 'Proposed';
                }
            }
        }

        return statuses;
    }

    /**
     * Manually set a block status (e.g., mark as Migrated directly)
     */
    async setBlockStatus(analysisId: string, blockName: string, status: string): Promise<void> {
        const analysis = await this.analysisRepo.findOne({ where: { id: analysisId } });
        if (!analysis) throw new NotFoundException('Analysis not found');

        // Upsert a special recommendation entry for manual status
        let rec = await this.repo.findOne({
            where: {
                analysisResult: { id: analysisId },
                blockName,
                serviceName: '__MANUAL_STATUS__'
            }
        });

        if (rec) {
            rec.status = status;
        } else {
            rec = this.repo.create({
                blockName,
                serviceName: '__MANUAL_STATUS__',
                method: 'N/A',
                url: 'N/A',
                description: `Manual status override: ${status}`,
                status,
                analysisResult: analysis
            });
        }

        await this.repo.save(rec);
    }
}
