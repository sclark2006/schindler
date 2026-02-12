import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { GitHubService } from './github.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GitHubController {
    constructor(private readonly githubService: GitHubService) { }

    @Post('issues')
    async createIssue(@Body() body: { projectId: string; title: string; description: string; labels?: string[] }) {
        return this.githubService.createIssue(body.projectId, body.title, body.description, body.labels);
    }
}
