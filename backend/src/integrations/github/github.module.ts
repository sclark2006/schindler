import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GitHubService } from './github.service';
import { GitHubController } from './github.controller';
import { GovernanceModule } from '../../governance/governance.module';

@Module({
    imports: [HttpModule, ConfigModule, GovernanceModule],
    providers: [GitHubService],
    controllers: [GitHubController],
    exports: [GitHubService],
})
export class GitHubModule { }
