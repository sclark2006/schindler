import { Controller, Post, Body, UseGuards, BadRequestException, Get, Query } from '@nestjs/common';
import { AdoService } from './ado.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface CreateWorkItemDto {
    title: string;
    description: string;
    type: string;
}

@Controller('ado')
@UseGuards(JwtAuthGuard)
export class AdoController {
    constructor(private readonly adoService: AdoService) { }

    @Post('work-items')
    async createWorkItem(@Body() body: { title: string; description: string; type?: string; parentId?: number; projectId?: string }) {
        return this.adoService.createWorkItem(body.title, body.description, body.type, body.parentId, body.projectId);
    }

    @Get('types')
    async getWorkItemTypes(@Query('projectId') projectId: string) {
        return this.adoService.getWorkItemTypes(projectId);
    }
}
