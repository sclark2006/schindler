import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscoveredService } from './entities/discovered-service.entity';

@Injectable()
export class GovernanceService {
    constructor(
        @InjectRepository(DiscoveredService)
        private servicesRepository: Repository<DiscoveredService>,
    ) { }

    async findAll(): Promise<DiscoveredService[]> {
        return this.servicesRepository.find({ order: { createdAt: 'DESC' } });
    }

    async register(serviceData: Partial<DiscoveredService>): Promise<DiscoveredService> {
        const service = this.servicesRepository.create(serviceData);
        return this.servicesRepository.save(service);
    }
}
