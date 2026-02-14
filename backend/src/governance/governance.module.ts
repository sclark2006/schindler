import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { BusinessDomain } from './entities/business-domain.entity';
import { DiscoveredService } from './entities/discovered-service.entity';
import { MigrationRule } from './entities/migration-rule.entity';
import { SystemConfig } from './entities/system-config.entity';
import { Project } from './entities/project.entity';
import { ProjectsModule } from './projects/projects.module';
import { DiscoveredServiceController } from './controllers/discovered-service.controller';
import { DiscoveredServiceService } from './services/discovered-service.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([BusinessDomain, DiscoveredService, MigrationRule, SystemConfig, Project]),
        ProjectsModule
    ],
    controllers: [GovernanceController, DiscoveredServiceController],
    providers: [GovernanceService, DiscoveredServiceService],
    exports: [GovernanceService, DiscoveredServiceService],
})
export class GovernanceModule { }
