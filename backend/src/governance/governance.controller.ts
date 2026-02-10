import { Controller, Get, Post, Body } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { DiscoveredService } from './entities/discovered-service.entity';

@Controller('governance')
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
}
