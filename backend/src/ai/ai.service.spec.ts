import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiProviderFactory } from './ai.factory';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../governance/entities/project.entity';
import { Repository } from 'typeorm';

const mockProjectRepository = {
    findOne: jest.fn(),
};

const mockAiProviderFactory = {
    createProvider: jest.fn(),
};

const mockProvider = {
    generateResponse: jest.fn(),
};

describe('AiService', () => {
    let service: AiService;
    let repo: Repository<Project>;
    let factory: AiProviderFactory;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiService,
                {
                    provide: getRepositoryToken(Project),
                    useValue: mockProjectRepository,
                },
                {
                    provide: AiProviderFactory,
                    useValue: mockAiProviderFactory,
                },
            ],
        }).compile();

        service = module.get<AiService>(AiService);
        repo = module.get<Repository<Project>>(getRepositoryToken(Project));
        factory = module.get<AiProviderFactory>(AiProviderFactory);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateResponse', () => {
        it('should generate response using the configured provider', async () => {
            const projectId = 'test-id';
            const prompt = 'test prompt';
            const aiConfig = { provider: 'openai', model: 'gpt-4' };
            const project = { id: projectId, aiConfig };
            const responseText = 'AI response';

            mockProjectRepository.findOne.mockResolvedValue(project);
            mockAiProviderFactory.createProvider.mockReturnValue(mockProvider);
            mockProvider.generateResponse.mockResolvedValue(responseText);

            const result = await service.generateResponse(projectId, prompt);

            expect(repo.findOne).toHaveBeenCalledWith({ where: { id: projectId } });
            expect(factory.createProvider).toHaveBeenCalledWith(aiConfig);
            expect(mockProvider.generateResponse).toHaveBeenCalledWith(prompt);
            expect(result).toBe(responseText);
        });

        it('should throw error if project not found', async () => {
            mockProjectRepository.findOne.mockResolvedValue(null);
            await expect(service.generateResponse('invalid', 'prompt')).rejects.toThrow('Project not found');
        });

        it('should throw error if ai config missing', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ id: 'id' });
            await expect(service.generateResponse('id', 'prompt')).rejects.toThrow('AI Configuration not found');
        });
    });
});
