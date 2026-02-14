import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalysisDashboard } from './AnalysisDashboard';
import axios from 'axios';
import { vi, describe, it, expect } from 'vitest';
import * as ProjectContextModule from '../context/ProjectContext';

vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// Mock the context module
vi.mock('../context/ProjectContext', () => ({
    useProject: vi.fn(),
    ProjectContext: { Provider: ({ children }: any) => children }
}));

const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockAnalysisResult = {
    complexityScore: 100,
    complexityLevel: 'High',
    parsedData: {
        stats: { totalBlocks: 5, totalLoc: 500 },
        complexityCandidates: [],
        triggers: [],
        programUnits: []
    }
};

describe('AnalysisDashboard AI', () => {
    it('generates summary when button clicked', async () => {
        // Setup mock
        (ProjectContextModule.useProject as any).mockReturnValue({
            currentProject: mockProject
        });

        mockedAxios.post.mockResolvedValue({ data: { summary: 'AI Summary' } });

        render(
            <AnalysisDashboard
                analysisResult={mockAnalysisResult}
                registerService={vi.fn()}
                setSelectedItem={vi.fn()}
                getRecommendations={vi.fn(() => [])}
            />
        );

        const button = screen.getByText('Generate Summary');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('AI Summary')).toBeInTheDocument();
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/ai/summary/test-project-id'),
            expect.objectContaining({
                complexity: 100,
                level: 'High',
                totalBlocks: 5,
                loc: 500
            })
        );
    });
});
