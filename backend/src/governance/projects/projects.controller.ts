import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
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

    @Post(':id') // Using POST for update to avoid CORS issues sometimes, but PUT is better. Let's use PUT and handle CORS if needed.
    // Actually nestjs standard is PUT
    @Put(':id')
    update(@Param('id') id: string, @Body() body: { name?: string; description?: string }): Promise<Project> {
        return this.projectsService.update(id, body);
    }

    @Delete(':id')
    delete(@Param('id') id: string): Promise<void> {
        return this.projectsService.delete(id);
    }
}
