import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    findAll(): Promise<Project[]> {
        return this.projectsService.findAll();
    }

    @Get('default')
    findDefault(): Promise<Project> {
        return this.projectsService.findDefault();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Project> {
        return this.projectsService.findOne(id);
    }

    @Post()
    create(@Body() body: { name: string; description?: string }): Promise<Project> {
        return this.projectsService.create(body);
    }
}
