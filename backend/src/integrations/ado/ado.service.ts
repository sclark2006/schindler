import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { GovernanceService } from '../../governance/governance.service';

@Injectable()
export class AdoService {
    private readonly logger = new Logger(AdoService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly governanceService: GovernanceService,
    ) { }

    async createWorkItem(title: string, description: string, type: string = 'User Story', parentId?: number, projectId: string = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
        const orgUrl = await this.governanceService.getConfig('ADO_ORG_URL', projectId);
        const project = await this.governanceService.getConfig('ADO_PROJECT', projectId);
        const pat = await this.governanceService.getConfig('ADO_PAT', projectId);

        if (!orgUrl || !project || !pat) {
            this.logger.error('Azure DevOps configuration is missing (key: ADO_ORG_URL, ADO_PROJECT, ADO_PAT not found in DB)');
            throw new InternalServerErrorException('Azure DevOps configuration is missing. Please configure it in Settings.');
        }

        const url = `${orgUrl}/${project}/_apis/wit/workitems/$${type}?api-version=7.1`;

        // JSON Patch format required by ADO API
        const patchData: any[] = [
            {
                op: 'add',
                path: '/fields/System.Title',
                value: title,
            },
            {
                op: 'add',
                path: '/fields/System.Description', // Or Microsoft.VSTS.Common.DescriptionHtml depending on process
                value: description,
            },
        ];

        // If linking to a parent work item (e.g. Feature -> User Story)
        if (parentId) {
            patchData.push({
                op: 'add',
                path: '/relations/-',
                value: {
                    rel: 'System.LinkTypes.Hierarchy-Reverse',
                    url: `${orgUrl}/${project}/_apis/wit/workItems/${parentId}`
                }
            });
        }

        const config = {
            headers: {
                'Content-Type': 'application/json-patch+json',
                Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
            },
        };

        try {
            const response: AxiosResponse<any> = await lastValueFrom(this.httpService.post(url, patchData, config));
            this.logger.log(`Created Work Item ${response.data.id}: ${title}`);
            return {
                id: response.data.id,
                url: response.data._links.html.href,
                fields: response.data.fields
            };
        } catch (error: any) {
            this.logger.error(`Failed to create Work Item in ADO: ${error.message}`, error.response?.data);
            throw new InternalServerErrorException(`Failed to create Work Item: ${error.message}`);
        }
    }

    async getWorkItemTypes(projectId: string): Promise<string[]> {
        const orgUrl = await this.governanceService.getConfig('ADO_ORG_URL', projectId);
        const project = await this.governanceService.getConfig('ADO_PROJECT', projectId);
        const pat = await this.governanceService.getConfig('ADO_PAT', projectId);

        if (!orgUrl || !project || !pat) return ['User Story', 'Task', 'Bug', 'Feature']; // Fallback

        const url = `${orgUrl}/${project}/_apis/wit/workitemtypes?api-version=7.1`;

        const config = {
            headers: {
                Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
            },
        };

        try {
            const response = await lastValueFrom(this.httpService.get(url, config));
            return response.data.value.map((t: any) => t.name);
        } catch (error) {
            this.logger.error(`Failed to fetch Work Item Types from ADO`, error);
            return ['User Story', 'Task', 'Bug', 'Feature']; // Fallback
        }
    }
}
