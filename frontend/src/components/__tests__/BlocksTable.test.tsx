import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlocksTable } from '../BlocksTable';
import { ProjectProvider } from '../../context/ProjectContext';
import { AuthProvider } from '../../context/AuthContext';
import axios from 'axios';
import { vi } from 'vitest';

// Mock Modules
vi.mock('axios');
vi.mock('../../context/ProjectContext', () => ({
    useProject: () => ({ currentProject: { id: 'test-project' } }),
    ProjectProvider: ({ children }: any) => <div>{children}</div>
}));
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ token: 'test-token' }),
    AuthProvider: ({ children }: any) => <div>{children}</div>
}));

const mockBlocks = [
    { name: 'BLOCK_A', dataSource: 'EMP', dataSourceType: 'TABLE', itemsCount: 5 },
    { name: 'BLOCK_B', dataSource: 'SELECT * FROM DEPT', dataSourceType: 'QUERY', itemsCount: 3 }
];

describe('BlocksTable', () => {
    const mockSetSelectedItem = vi.fn();
    const mockCreateDevOpsTicket = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render data blocks correctly', () => {
        render(
            <BlocksTable
                blocks={mockBlocks}
                setSelectedItem={mockSetSelectedItem}
                createDevOpsTicket={mockCreateDevOpsTicket}
            />
        );
        expect(screen.getByText('Data Blocks Detected (2)')).toBeDefined();
        expect(screen.getByText('BLOCK_A')).toBeDefined();
        expect(screen.getByText('BLOCK_B')).toBeDefined();
    });

    it('should call onBlockSelect when a row is clicked', () => {
        const onBlockSelectMock = vi.fn();
        render(
            <BlocksTable
                blocks={mockBlocks}
                setSelectedItem={mockSetSelectedItem}
                createDevOpsTicket={mockCreateDevOpsTicket}
                onBlockSelect={onBlockSelectMock}
            />
        );

        fireEvent.click(screen.getByText('BLOCK_A'));
        expect(onBlockSelectMock).toHaveBeenCalledWith('BLOCK_A');
    });

    it.skip('should handle generate recommendations flow', async () => {
        // Mock API responses
        (axios.get as any).mockResolvedValueOnce({ data: [] }); // rules
        (axios.get as any).mockResolvedValueOnce({ data: [] }); // domains
        (axios.post as any).mockResolvedValueOnce({
            data: [
                { serviceName: 'get-emp', method: 'GET', url: '/api/emp', description: 'Desc', domain: 'HR' }
            ]
        });

        render(
            <BlocksTable
                blocks={mockBlocks}
                setSelectedItem={mockSetSelectedItem}
                createDevOpsTicket={mockCreateDevOpsTicket}
            />
        );

        // Find and click generate button (Sparkles icon)
        // Since we don't have text, use title attribute or similar if available. 
        // In the code: title="Generate Recommendations"
        const genButtons = screen.getAllByTitle('Generate Recommendations');
        fireEvent.click(genButtons[0]);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/ai/recommend/block'),
                expect.anything()
            );
        });

        // Modal should appear
        expect(screen.getByText('AI Recommendations: BLOCK_A')).toBeDefined();
        expect(screen.getByText('get-emp')).toBeDefined();
    });

    it.skip('should create tickets for selected recommendations', async () => {
        // Setup state with modal open (simulated by re-running flow or just trusting integration)
        // Let's re-run flow for simplicity
        (axios.get as any).mockResolvedValueOnce({ data: [] });
        (axios.get as any).mockResolvedValueOnce({ data: [] });
        (axios.post as any).mockResolvedValueOnce({
            data: [
                { serviceName: 'get-emp', method: 'GET', url: '/api/emp', description: 'Desc', domain: 'HR' }
            ]
        });

        render(
            <BlocksTable
                blocks={mockBlocks}
                setSelectedItem={mockSetSelectedItem}
                createDevOpsTicket={mockCreateDevOpsTicket}
            />
        );

        fireEvent.click(screen.getAllByTitle('Generate Recommendations')[0]);

        await waitFor(() => screen.findByText('get-emp'));

        // Select the item
        fireEvent.click(screen.getByText('get-emp'));

        // Mock Config for Create Tickets
        (axios.get as any).mockResolvedValueOnce({ data: [{ key: 'ADO_ORG_URL', value: 'url' }] }); // config
        (axios.post as any).mockResolvedValueOnce({ data: { id: '123' } }); // create ticket

        // Click Create
        fireEvent.click(screen.getByText(/Create 1 Tickets/));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/ado/work-items'), // Assuming ADO from config
                expect.objectContaining({ title: expect.stringContaining('[BE] Implement get-emp') }),
                expect.anything()
            );
        });
    });
});
