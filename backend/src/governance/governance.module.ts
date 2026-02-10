import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { DiscoveredService } from './entities/discovered-service.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DiscoveredService])],
    controllers: [GovernanceController],
    providers: [GovernanceService],
})
export class GovernanceModule { }
