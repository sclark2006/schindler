import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DiscoveredServiceService } from '../services/discovered-service.service';

@Controller('discovered-services')
@UseGuards(JwtAuthGuard)
export class DiscoveredServiceController {
    constructor(private readonly service: DiscoveredServiceService) { }

    @Get()
    async findAll(@Query('projectId') projectId: string) {
        return this.service.findAll(projectId);
    }

    @Get('similar')
    async findSimilar(
        @Query('projectId') projectId: string,
        @Query('dataSource') dataSource: string,
        @Query('method') method: string
    ) {
        return this.service.findSimilar(projectId, dataSource, method);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post('register')
    async registerAsExistent(@Body() data: any) {
        return this.service.registerAsExistent(data);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.service.delete(id);
        return { success: true };
    }
}
