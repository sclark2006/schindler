import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscoveredService } from '../entities/discovered-service.entity';
import { Recommendation } from '../../ai/entities/recommendation.entity';

@Injectable()
export class DiscoveredServiceService {
    constructor(
        @InjectRepository(DiscoveredService)
        private readonly repo: Repository<DiscoveredService>,
    ) { }

    async findAll(projectId: string): Promise<DiscoveredService[]> {
        return this.repo.find({
            where: { projectId },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<DiscoveredService> {
        const service = await this.repo.findOne({ where: { id } });
        if (!service) throw new NotFoundException('Service not found');
        return service;
    }

    /**
     * Find similar services to detect duplicates
     * Matches on: projectId + dataSource + method
     */
    async findSimilar(projectId: string, dataSource: string, method: string): Promise<DiscoveredService[]> {
        return this.repo.find({
            where: {
                projectId,
                dataSource,
                method
            }
        });
    }

    /**
     * Register a service from a recommendation (auto-register on ticket creation)
     */
    async registerFromRecommendation(recommendation: Recommendation, ticketData: any, analysisId: string): Promise<DiscoveredService> {
        const service = this.repo.create({
            originalName: recommendation.blockName,
            sourceType: 'BLOCK', // Can be enhanced to detect RECORD_GROUP/PLSQL
            method: recommendation.method,
            domain: recommendation.domain,
            endpoint: recommendation.url,
            dataSource: recommendation.blockName,
            dataSourceType: 'TABLE', // Default, can be enhanced
            proposedServiceName: recommendation.serviceName,
            status: 'APPROVED',
            ticketId: ticketData.id,
            ticketUrl: ticketData.url,
            ticketStatus: 'ACTIVE',
            projectId: ticketData.projectId || recommendation.analysisResult?.project?.id
        });

        return this.repo.save(service);
    }

    /**
     * Register an existing service without creating a ticket
     */
    async registerAsExistent(data: {
        projectId: string;
        originalName: string;
        sourceType: string;
        method: string;
        domain?: string;
        endpoint: string;
        dataSource: string;
        dataSourceType?: string;
        proposedServiceName: string;
    }): Promise<DiscoveredService> {
        const service = this.repo.create({
            ...data,
            status: 'MIGRATED',
            ticketStatus: 'COMPLETED'
        });

        return this.repo.save(service);
    }

    async delete(id: string): Promise<void> {
        const result = await this.repo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Service not found');
        }
    }
}
