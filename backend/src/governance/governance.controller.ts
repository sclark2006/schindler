import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { DiscoveredService } from './entities/discovered-service.entity';
import { SystemConfig } from './entities/system-config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('governance')
@UseGuards(JwtAuthGuard)
export class GovernanceController {
    constructor(private readonly governanceService: GovernanceService) { }

    @Get('services')
    findAll(): Promise<DiscoveredService[]> {
        return this.governanceService.findAll();
    }

    @Post('register')
    register(@Body() serviceData: Partial<DiscoveredService>): Promise<DiscoveredService> {
        return this.governanceService.register(serviceData);
    }

    @Get('config')
    async getAllConfigs(@Query('projectId') projectId: string): Promise<SystemConfig[]> {
        return this.governanceService.getAllConfigs(projectId);
    }

    @Post('config')
    async saveConfig(@Body() body: { key: string; value: string; description?: string; isSecret?: boolean; projectId?: string }): Promise<SystemConfig> {
        return this.governanceService.saveConfig(body.key, body.value, body.description, body.isSecret, body.projectId);
    }
}
