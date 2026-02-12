
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../governance/entities/project.entity';
import { AiProviderFactory, AiConfig } from './ai.factory';

@Injectable()
export class AiService {
    constructor(
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
        private aiFactory: AiProviderFactory,
    ) { }

    async generateResponse(projectId: string, prompt: string): Promise<string> {
        const project = await this.projectsRepository.findOne({ where: { id: projectId } });
        if (!project) throw new Error('Project not found');

        const config = project.aiConfig as AiConfig;
        if (!config || !config.provider) {
            throw new Error('AI Configuration not found for this project');
        }

        const provider = this.aiFactory.createProvider(config);
        return provider.generateResponse(prompt);
    }

    async generateSummary(projectId: string, contextData: any): Promise<string> {
        const project = await this.projectsRepository.findOne({ where: { id: projectId } });
        if (!project) throw new Error('Project not found');

        const config = project.aiConfig as AiConfig;
        if (!config || !config.provider) {
            throw new Error('AI Configuration not found for this project');
        }

        const provider = this.aiFactory.createProvider(config);
        const prompt = this.buildSummaryPrompt(contextData);

        return provider.generateResponse(prompt);
    }

    async explainCode(projectId: string, code: string): Promise<string> {
        const project = await this.projectsRepository.findOne({ where: { id: projectId } });
        if (!project) throw new Error('Project not found');

        const config = project.aiConfig as AiConfig;
        if (!config || !config.provider) {
            throw new Error('AI Configuration not found for this project');
        }

        const provider = this.aiFactory.createProvider(config);
        const prompt = `Explain the following Oracle Forms PL/SQL code in simple terms and suggest a modern NestJS/React architecture replacement:\n\n${code}`;

        return provider.generateResponse(prompt);
    }

    async generateBlockRecommendations(projectId: string, blockData: any, rules: any[], domains: any[]): Promise<any[]> {
        const project = await this.projectsRepository.findOne({ where: { id: projectId } });
        if (!project) throw new Error('Project not found');

        const config = project.aiConfig as AiConfig;
        if (!config || !config.provider) {
            throw new Error('AI Configuration not found for this project');
        }

        const provider = this.aiFactory.createProvider(config);

        // Filter rules for Backend API
        const backendRules = rules.filter(r => r.targetLayer === 'Backend API' && r.isActive);
        const domainNames = domains.map(d => d.name).join(', ');

        const prompt = `
        Analyze the following Oracle Forms Data Block and suggest a Modern NestJS REST API architecture.
        
        **Block Metadata:**
        - Name: ${blockData.name}
        - Data Source Type: ${blockData.dataSourceType} (TABLE or QUERY)
        - Data Source: ${blockData.dataSource}
        - Columns: ${blockData.itemsCount} items
        
        **Context:**
        - Business Domains: ${domainNames}
        - Migration Rules (Backend Patterns): ${backendRules.map(r => r.patternName).join(', ')}

        **Requirements:**
        1. If Data Source Type is TABLE, suggest full CRUD endpoints (GET, POST, PUT, DELETE).
        2. If Data Source Type is QUERY, suggest only GET endpoint.
        3. Assign a Business Domain from the list if relevant, otherwise suggest a new one.
        4. Provide a technical technical description for each endpoint explaining the logic.
        
        **Output JSON Format (Array of objects):**
        [
            {
                "serviceName": "get-employees",
                "method": "GET",
                "url": "/api/employees",
                "description": "Fetches list of employees...",
                "domain": "HR"
            }
        ]
        Return ONLY valid JSON.
        `;

        const response = await provider.generateResponse(prompt);
        try {
            // Clean up code blocks if present
            const cleanJson = response.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse AI response', response);
            return [];
        }
    }

    private buildSummaryPrompt(data: any): string {
        return `Analyze the following Oracle Forms module components. 
    Module: ${data.moduleName}
    Blocks: ${data.blocks.map((b: any) => b.name).join(', ')}
    Tables/Views: ${data.dataSources.join(', ')}
    
    The user wants a summary of the form's functionalities.
    **Instructions:**
    1.  **Start strictly** by describing the functionalities of the form based on the blocks and tables (e.g., "This form allows users to manage...").
    2.  Mention the complexity level and key risks.
    3.  Suggest a brief migration strategy.
    
    Keep it professional and concise (max 1 paragraph).`;
    }
}
