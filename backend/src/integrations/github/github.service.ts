import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GovernanceService } from '../../governance/governance.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GitHubService {
    constructor(
        private readonly httpService: HttpService,
        private readonly governanceService: GovernanceService
    ) { }

    private parseRepoUrl(url: string): { owner: string; repo: string } {
        // Expected format: https://github.com/owner/repo or https://github.com/owner/repo.git
        const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
        if (!match) throw new Error('Invalid GitHub Repository URL');
        return { owner: match[1], repo: match[2] };
    }

    async createIssue(projectId: string, title: string, description: string, labels: string[] = []): Promise<any> {
        // 1. Get Configs
        const repoUrl = await this.governanceService.getConfig('GITHUB_REPO_URL', projectId);
        const token = await this.governanceService.getConfig('GITHUB_TOKEN', projectId);

        if (!repoUrl || !token) {
            throw new HttpException('GitHub configuration (URL or Token) not found for this project', HttpStatus.BAD_REQUEST);
        }

        const { owner, repo } = this.parseRepoUrl(repoUrl);

        // 2. Create Issue via GitHub API
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    apiUrl,
                    { title: `[Schindler] ${title}`, body: description, labels },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'X-GitHub-Api-Version': '2022-11-28',
                            Accept: 'application/vnd.github+json'
                        }
                    }
                )
            );
            return { id: data.number, url: data.html_url, provider: 'GitHub' };
        } catch (error: any) {
            console.error('GitHub API Error:', error.response?.data || error.message);
            throw new HttpException(
                `Failed to create GitHub Issue: ${error.response?.data?.message || error.message}`,
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    async getLabels(projectId: string): Promise<string[]> {
        const repoUrl = await this.governanceService.getConfig('GITHUB_REPO_URL', projectId);
        const token = await this.governanceService.getConfig('GITHUB_TOKEN', projectId);

        if (!repoUrl || !token) return ['bug', 'enhancement', 'documentation', 'duplicate', 'help wanted', 'good first issue', 'invalid', 'question', 'wontfix'];

        const { owner, repo } = this.parseRepoUrl(repoUrl);
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/labels`;

        try {
            const { data } = await firstValueFrom(
                this.httpService.get(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-GitHub-Api-Version': '2022-11-28',
                        Accept: 'application/vnd.github+json'
                    }
                })
            );
            return data.map((l: any) => l.name);
        } catch (error) {
            console.error('GitHub Labels Error:', error);
            return ['bug', 'enhancement', 'documentation']; // Fallback
        }
    }
}
