import { Test, TestingModule } from '@nestjs/testing';
import { GitHubService } from './github.service';
import { HttpService } from '@nestjs/axios';
import { GovernanceService } from '../../governance/governance.service';
import { of, throwError } from 'rxjs';
import { HttpException } from '@nestjs/common';

const mockHttpService = {
    post: jest.fn(),
};

const mockGovernanceService = {
    getConfig: jest.fn(),
};

describe('GitHubService', () => {
    let service: GitHubService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GitHubService,
                { provide: HttpService, useValue: mockHttpService },
                { provide: GovernanceService, useValue: mockGovernanceService },
            ],
        }).compile();

        service = module.get<GitHubService>(GitHubService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createIssue', () => {
        const projectId = 'test-project';
        const title = 'Test Issue';
        const description = 'Description';
        const labels = ['bug'];

        it('should create an issue successfully', async () => {
            mockGovernanceService.getConfig.mockImplementation((key) => {
                if (key === 'GITHUB_REPO_URL') return Promise.resolve('https://github.com/owner/repo');
                if (key === 'GITHUB_TOKEN') return Promise.resolve('test-token');
                return Promise.resolve(null);
            });

            const mockResponse = {
                data: {
                    number: 1,
                    html_url: 'https://github.com/owner/repo/issues/1',
                },
            };
            mockHttpService.post.mockReturnValue(of(mockResponse));

            const result = await service.createIssue(projectId, title, description, labels);

            expect(mockGovernanceService.getConfig).toHaveBeenCalledWith('GITHUB_REPO_URL', projectId);
            expect(mockGovernanceService.getConfig).toHaveBeenCalledWith('GITHUB_TOKEN', projectId);
            expect(mockHttpService.post).toHaveBeenCalledWith(
                'https://api.github.com/repos/owner/repo/issues',
                { title: `[Schindler] ${title}`, body: description, labels },
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            );
            expect(result).toEqual({ id: 1, url: 'https://github.com/owner/repo/issues/1', provider: 'GitHub' });
        });

        it('should throw error if config is missing', async () => {
            mockGovernanceService.getConfig.mockResolvedValue(null);

            await expect(service.createIssue(projectId, title, description)).rejects.toThrow(HttpException);
            await expect(service.createIssue(projectId, title, description)).rejects.toThrow('GitHub configuration (URL or Token) not found');
        });

        it('should handle API errors', async () => {
            mockGovernanceService.getConfig.mockResolvedValue('value'); // both exist
            // Fix parsing logic assumption in mock
            mockGovernanceService.getConfig.mockImplementation((key) => {
                if (key === 'GITHUB_REPO_URL') return Promise.resolve('https://github.com/owner/repo');
                return Promise.resolve('token');
            });

            const errorResponse = {
                response: {
                    data: { message: 'Validation Failed' },
                    status: 422,
                },
            };
            mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

            await expect(service.createIssue(projectId, title, description)).rejects.toThrow(HttpException);
            await expect(service.createIssue(projectId, title, description)).rejects.toThrow('Failed to create GitHub Issue: Validation Failed');
        });
    });
});
