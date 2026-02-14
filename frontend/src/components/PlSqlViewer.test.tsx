import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlSqlViewer } from './PlSqlViewer';
import axios from 'axios';
import { vi, describe, it, expect } from 'vitest';
import * as ProjectContextModule from '../context/ProjectContext';

vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// Mock context
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

const mockTriggers = [
    { name: 'WHEN-NEW-FORM-INSTANCE', code: 'BEGIN NULL; END;', parentBlock: 'MODULE', loc: 10 }
];

const mockProgramUnits = [
    { name: 'CHECK_STATUS', code: 'PROCEDURE ...', loc: 20 }
];

describe('PlSqlViewer AI', () => {
    it('generates explanation when button clicked', async () => {
        // Setup mock
        (ProjectContextModule.useProject as any).mockReturnValue({
            currentProject: mockProject
        });

        mockedAxios.post.mockResolvedValue({ data: { text: 'AI Explanation' } });
        const setSelectedItem = vi.fn();

        render(
            <PlSqlViewer
                triggers={mockTriggers}
                programUnits={mockProgramUnits}
                setSelectedItem={setSelectedItem}
                registerService={vi.fn()}
                createDevOpsTicket={vi.fn()}
            />
        );

        // Hover to show button (simulated by finding the button directly since functionality doesn't depend on hover state in tests usually, unless hidden)
        // The button has text 'Explicar IA'
        // But it is initially hidden in the UI (opacity 0). FireEvent.click might still work if it's in the DOM.
        // Let's try to find it.

        const buttons = screen.getAllByText('Explain (AI)');
        const triggerButton = buttons[0];

        fireEvent.click(triggerButton);

        expect(await screen.findByText('Analyzing...')).toBeInTheDocument();

        await waitFor(() => {
            expect(setSelectedItem).toHaveBeenCalledWith(expect.objectContaining({
                aiExplanation: 'AI Explanation'
            }));
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/ai/generate'),
            expect.objectContaining({
                projectId: 'test-project-id',
                // prompt is built inside
            })
        );
    });
});
