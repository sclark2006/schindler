import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscoveredService } from './entities/discovered-service.entity';
import { SystemConfig } from './entities/system-config.entity';

@Injectable()
export class GovernanceService {
    constructor(
        @InjectRepository(DiscoveredService)
        private servicesRepository: Repository<DiscoveredService>,
        @InjectRepository(SystemConfig)
        private configRepository: Repository<SystemConfig>,
    ) { }

    async findAll(): Promise<DiscoveredService[]> {
        return this.servicesRepository.find({ order: { createdAt: 'DESC' } });
    }

    async register(serviceData: Partial<DiscoveredService>): Promise<DiscoveredService> {
        const service = this.servicesRepository.create(serviceData);
        return this.servicesRepository.save(service);
    }

    // --- System Configuration Methods ---

    async getConfig(key: string, projectId: string = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'): Promise<string | null> {
        const config = await this.configRepository.findOne({ where: { key, projectId } });
        return config ? config.value : null;
    }

    async getAllConfigs(projectId: string = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'): Promise<SystemConfig[]> {
        return this.configRepository.find({ where: { projectId } });
    }

    async saveConfig(key: string, value: string, description?: string, isSecret: boolean = false, projectId: string = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'): Promise<SystemConfig> {
        let config = await this.configRepository.findOne({ where: { key, projectId } });
        if (!config) {
            config = this.configRepository.create({ key, value, description, isSecret, projectId });
        } else {
            config.value = value;
            if (description) config.description = description;
            config.isSecret = isSecret;
        }
        return this.configRepository.save(config);
    }
}
