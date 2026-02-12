import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TicketCreationModal } from '../TicketCreationModal';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

vi.mock('axios');

const mockAuthContext = {
    user: { username: 'testuser', sub: 1 },
    token: 'test-token',
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
};

const renderWithAuth = (ui: React.ReactElement) => {
    return render(
        <AuthContext.Provider value={mockAuthContext}>
            {ui}
        </AuthContext.Provider>
    );
};

describe('TicketCreationModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        initialTitle: 'Test Title',
        initialDescription: 'Test Description',
        projectId: 'test-project-id',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        renderWithAuth(<TicketCreationModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Create Ticket')).toBeNull();
    });

    it('should render correctly when open', async () => {
        (axios.get as any).mockResolvedValue({ data: [] }); // No providers
        renderWithAuth(<TicketCreationModal {...defaultProps} />);

        expect(screen.getByRole('heading', { name: /create ticket/i })).toBeDefined();
        expect(screen.getByDisplayValue('Test Title')).toBeDefined();

        // Wait for provider check
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/governance/config'), expect.any(Object));
        });
    });

    it('should check providers on mount', async () => {
        (axios.get as any).mockResolvedValue({
            data: [
                { key: 'ADO_ORG_URL', value: 'url' },
                { key: 'GITHUB_REPO_URL', value: 'url' }
            ]
        });

        renderWithAuth(<TicketCreationModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Azure DevOps')).toBeDefined();
            expect(screen.getByText('GitHub')).toBeDefined();
        });
    });

    it('should set default provider if only one exists', async () => {
        (axios.get as any).mockResolvedValue({
            data: [{ key: 'GITHUB_REPO_URL', value: 'url' }]
        });
        (axios.post as any).mockResolvedValue({ data: { id: '123' } });

        renderWithAuth(<TicketCreationModal {...defaultProps} />);

        await waitFor(() => {
            // Logic sets provider state, we can verify by checking if the submit button says "Create Issue"
            // But button text depends on state which is internal.
            // We can check if "Azure DevOps" radio is NOT present and "GitHub" IS present?
            // Actually, if only one, we might not show radio buttons depending on implementation?
            // Implementation: {(availableProviders.ado && availableProviders.github) && (...)}
            // So if only one, radio group is hidden.
        });

        // Let's verify submission uses the correct endpoint
        const submitBtn = screen.getByRole('button', { name: /create (ticket|issue)/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/github/issues'),
                expect.any(Object),
                expect.any(Object)
            );
        });
    });

    it('should show error if no provider is selected/available', async () => {
        (axios.get as any).mockResolvedValue({ data: [] }); // No providers

        renderWithAuth(<TicketCreationModal {...defaultProps} />);

        // Wait for check
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        const submitBtn = screen.getByRole('button', { name: /create (ticket|issue)/i });
        expect(submitBtn).toBeDisabled();

        // Error message should be visible
        await waitFor(() => {
            expect(screen.getByText(/No integrations configured/i)).toBeDefined();
        });
    });
});
