import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSettings } from '../ProjectSettings';
import axios from 'axios';
import { ProjectContext } from '../../context/ProjectContext';

vi.mock('axios');

const mockProjectContext = {
    projects: [],
    currentProject: { id: 'test-project-id', name: 'Test Project' },
    setCurrentProject: vi.fn(),
    refreshProjects: vi.fn(),
    loading: false,
    isLoading: false,
    createProject: vi.fn(),
};

const renderWithProject = (ui: React.ReactElement) => {
    return render(
        <ProjectContext.Provider value={mockProjectContext}>
            {ui}
        </ProjectContext.Provider>
    );
};

describe('ProjectSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        (axios.get as any).mockResolvedValue({ data: [] });
    });

    it('should render General tab by default', async () => {
        renderWithProject(<ProjectSettings />);
        expect(screen.getByText('Project Name')).toBeDefined();
        expect(screen.getByDisplayValue('Test Project')).toBeDefined();
    });

    it('should update project details', async () => {
        renderWithProject(<ProjectSettings />);

        const nameInput = screen.getByDisplayValue('Test Project');
        fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

        const updateBtn = screen.getByText('Update Details');
        fireEvent.click(updateBtn);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/projects/test-project-id'),
                expect.objectContaining({ name: 'Updated Project' })
            );
        });
    });

    it('should fetch config with default DEV environment', async () => {
        renderWithProject(<ProjectSettings />);

        // Wait for initial fetch
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/governance/config'),
                expect.objectContaining({
                    params: expect.objectContaining({
                        projectId: 'test-project-id',
                        environment: 'DEV'
                    })
                })
            );
        });
    });

    it('should render Environment Selector in Integrations tab', async () => {
        renderWithProject(<ProjectSettings />);

        // Switch to Integrations tab
        fireEvent.click(screen.getByText('Integrations'));

        expect(screen.getByText('DEV')).toBeDefined();
        expect(screen.getByText('QA')).toBeDefined();
        expect(screen.getByText('PROD')).toBeDefined();
    });

    it('should re-fetch config when switching environment', async () => {
        renderWithProject(<ProjectSettings />);

        // Switch to Integrations tab
        fireEvent.click(screen.getByText('Integrations'));

        // Switch to QA
        fireEvent.click(screen.getByText('QA'));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/governance/config'),
                expect.objectContaining({
                    params: expect.objectContaining({
                        projectId: 'test-project-id',
                        environment: 'QA'
                    })
                })
            );
        });
    });

    it('should save config with selected environment', async () => {
        renderWithProject(<ProjectSettings />);

        fireEvent.click(screen.getByText('Integrations'));
        fireEvent.click(screen.getByText('PROD')); // Select PROD

        // Mock input change
        const orgInput = screen.getByPlaceholderText('https://dev.azure.com/myorg');
        fireEvent.change(orgInput, { target: { value: 'https://dev.azure.com/prodorg' } });

        // Click Save
        const saveBtn = screen.getByText('Save ADO Configuration');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/governance/config'),
                expect.objectContaining({
                    key: 'ADO_ORG_URL',
                    value: 'https://dev.azure.com/prodorg',
                    projectId: 'test-project-id',
                    environment: 'PROD'
                })
            );
        });
    });

    it('should fetch domains with projectId', async () => {
        renderWithProject(<ProjectSettings />);

        fireEvent.click(screen.getByText('Business Domains'));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/governance/domains'),
                expect.objectContaining({
                    params: expect.objectContaining({ projectId: 'test-project-id' })
                })
            );
        });
    });

    it('should handle rule editing flow', async () => {
        const mockRules = [
            { id: '1', patternName: 'Test Rule', ticketTemplate: 'Template content', targetLayer: 'Backend API' }
        ];

        (axios.get as any).mockImplementation((url: string) => {
            if (url.includes('/governance/rules/1')) return Promise.resolve({ data: mockRules[0] });
            if (url.includes('/governance/rules')) return Promise.resolve({ data: mockRules });
            return Promise.resolve({ data: [] });
        });

        renderWithProject(<ProjectSettings />);
        fireEvent.click(screen.getByText('Migration Rules'));

        // Check list view
        await waitFor(() => {
            expect(screen.getByText('Test Rule')).toBeDefined();
            expect(screen.getByText('Edit')).toBeDefined();
        });

        // Click Edit
        fireEvent.click(screen.getByText('Edit'));

        // Check edit mode
        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Rule')).toBeDefined();
            expect(screen.getByDisplayValue('Template content')).toBeDefined();
        });

        // Modification
        const nameInput = screen.getByDisplayValue('Test Rule');
        fireEvent.change(nameInput, { target: { value: 'Updated Rule' } });

        // Save
        const saveBtn = screen.getByText('Save Changes');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/governance/rules/1'),
                expect.objectContaining({ patternName: 'Updated Rule' })
            );
        });
    });
});
