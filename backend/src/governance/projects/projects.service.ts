import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
    ) { }

    async updateAiConfig(projectId: string, config: any): Promise<Project> {
        const project = await this.projectsRepository.findOne({ where: { id: projectId } });
        if (!project) throw new Error('Project not found');

        project.aiConfig = config;
        return this.projectsRepository.save(project);
    }

    async findAll(): Promise<Project[]> {
        return this.projectsRepository.find({ order: { createdAt: 'DESC' } });
    }

    async findOne(id: string): Promise<Project> {
        const project = await this.projectsRepository.findOne({ where: { id } });
        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }
        return project;
    }

    async create(createProjectDto: { name: string; description?: string }): Promise<Project> {
        const project = this.projectsRepository.create(createProjectDto);
        return this.projectsRepository.save(project);
    }

    async findDefault(): Promise<Project> {
        // Find default or first available
        const project = await this.projectsRepository.findOne({ where: { name: 'Default Project' } });
        if (project) return project;

        const first = await this.projectsRepository.findOne({ order: { createdAt: 'ASC' } });
        return first;
    }
}
