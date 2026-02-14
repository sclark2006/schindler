import { Controller, Get, Post, Put, Body, UseGuards, Query, Param } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { DiscoveredService } from './entities/discovered-service.entity';
import { SystemConfig } from './entities/system-config.entity';
import { BusinessDomain } from './entities/business-domain.entity';
import { MigrationRule } from './entities/migration-rule.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('governance')
@UseGuards(JwtAuthGuard)
export class GovernanceController {
    constructor(private readonly governanceService: GovernanceService) { }

    @Get('services')
    findAll(@Query('projectId') projectId: string): Promise<DiscoveredService[]> {
        return this.governanceService.findAll(projectId);
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
    async saveConfig(@Body() body: { key: string; value: string; description?: string; isSecret?: boolean; projectId?: string; environment?: string }): Promise<SystemConfig> {
        return this.governanceService.saveConfig(body.key, body.value, body.description, body.isSecret, body.projectId, body.environment);
    }

    @Get('domains')
    async getDomains(@Query('projectId') projectId: string): Promise<BusinessDomain[]> {
        return this.governanceService.getDomains(projectId);
    }

    @Post('domains')
    async createDomain(@Body() body: Partial<BusinessDomain>): Promise<BusinessDomain> {
        return this.governanceService.createDomain(body);
    }

    @Get('rules')
    async getRules(): Promise<MigrationRule[]> {
        return this.governanceService.getRules();
    }

    @Post('rules')
    async createRule(@Body() body: Partial<MigrationRule>): Promise<MigrationRule> {
        return this.governanceService.createRule(body);
    }

    @Get('rules/:id')
    async getRule(@Param('id') id: string): Promise<MigrationRule> {
        return this.governanceService.getRule(id);
    }

    @Put('rules/:id')
    async updateRule(@Param('id') id: string, @Body() body: Partial<MigrationRule>): Promise<MigrationRule> {
        return this.governanceService.updateRule(id, body);
    }
}
