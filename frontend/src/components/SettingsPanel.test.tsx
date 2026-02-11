import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as ProjectContextModule from '../context/ProjectContext';

vi.mock('axios');
const mockedAxios = axios as vi.Mocked<typeof axios>;

// Mock the context module
vi.mock('../context/ProjectContext', () => ({
    useProject: vi.fn(),
    ProjectContext: { Provider: ({ children }: any) => children } // Generic provider mock
}));

const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date()
};

describe('SettingsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedAxios.get.mockResolvedValue({ data: [] });

        // Setup default mock for useProject
        (ProjectContextModule.useProject as any).mockReturnValue({
            currentProject: mockProject,
            setCurrentProject: vi.fn(),
            projects: [mockProject],
            fetchProjects: vi.fn(),
            isLoading: false,
            createProject: vi.fn()
        });
    });

    it('renders tabs correctly', () => {
        render(<SettingsPanel />);
        expect(screen.getByText('Business Domains')).toBeInTheDocument();
        expect(screen.getByText('Migration Rules')).toBeInTheDocument();
        expect(screen.getByText('AI & Generation')).toBeInTheDocument();
    });

    it('loads AI config on mount', async () => {
        const aiConfig = { provider: 'gemini', model: 'gemini-pro' };
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/projects/')) return Promise.resolve({ data: { aiConfig } });
            return Promise.resolve({ data: [] });
        });

        render(<SettingsPanel />);

        // Switch to AI tab
        fireEvent.click(screen.getByText('AI & Generation'));

        // Wait for tab content to appear
        expect(await screen.findByText('AI Provider')).toBeInTheDocument();

        // Use findByDisplayValue which waits for the state update.
        // For select elements, this matches the text of the selected option.
        expect(await screen.findByDisplayValue('Google Gemini')).toBeInTheDocument();
        expect(screen.getByDisplayValue('gemini-3-pro')).toBeInTheDocument();
    });

    it('saves AI config', async () => {
        // Mock initial AI config for the GET request when the component mounts
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/projects/')) {
                return Promise.resolve({ data: { aiConfig: { provider: 'openai', model: 'gpt-4o' } } });
            }
            return Promise.resolve({ data: [] });
        });
        mockedAxios.put.mockResolvedValue({});

        render(<SettingsPanel />);

        fireEvent.click(screen.getByText('AI & Generation'));

        // Wait for the AI config to load and button to be in stored state
        const saveButton = await screen.findByText('Configuration Saved');
        expect(saveButton).toBeDisabled();

        // Change a value to enable button
        fireEvent.change(screen.getByDisplayValue('gpt-4o'), { target: { value: 'gpt-4-turbo' } });

        const enabledSaveButton = await screen.findByText('Save AI Configuration');
        expect(enabledSaveButton).toBeEnabled();
        fireEvent.click(enabledSaveButton);

        await waitFor(() => {
            expect(mockedAxios.put).toHaveBeenCalledWith(
                expect.stringContaining('/ai/config/test-project-id'),
                expect.objectContaining({ provider: 'openai', model: 'gpt-4-turbo' })
            );
        });

        // Check for toast
        expect(await screen.findByText('Configuración de IA guardada correctamente.')).toBeInTheDocument();

        // Button should go back to disabled/saved state
        expect(await screen.findByText('Configuration Saved')).toBeDisabled();
    });

    it('displays error toast on save failure', async () => {
        // Mock initial AI config
        mockedAxios.get.mockImplementation((url) => {
            if (url.includes('/projects/')) {
                return Promise.resolve({ data: { aiConfig: { provider: 'openai', model: 'gpt-4o' } } });
            }
            return Promise.resolve({ data: [] });
        });
        mockedAxios.put.mockRejectedValue(new Error('Network Error'));

        render(<SettingsPanel />);

        fireEvent.click(screen.getByText('AI & Generation'));

        // Wait for initial load
        await screen.findByText('Configuration Saved');

        // Change config to enable save
        fireEvent.change(screen.getByDisplayValue('gpt-4o'), { target: { value: 'gpt-4-turbo' } });

        const saveButton = await screen.findByText('Save AI Configuration');
        fireEvent.click(saveButton);

        // Check for error toast
        expect(await screen.findByText('Error al guardar configuración de IA.')).toBeInTheDocument();
    });
});
