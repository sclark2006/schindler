import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AdoService } from './ado.service';
import { AdoController } from './ado.controller';
import { GovernanceModule } from '../../governance/governance.module';

@Module({
    imports: [HttpModule, ConfigModule, GovernanceModule],
    providers: [AdoService],
    controllers: [AdoController],
    exports: [AdoService],
})
export class AdoModule { }
