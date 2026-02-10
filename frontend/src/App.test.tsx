
import { render } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import App from './App';
import React from 'react';

// Mock AuthContext
vi.mock('./context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useAuth: () => ({
        user: { username: 'testuser' },
        login: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
        loading: false
    })
}));

// Mock ProjectContext
vi.mock('./context/ProjectContext', () => ({
    ProjectProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useProject: () => ({
        projects: [],
        currentProject: { id: 'test-id', name: 'Test Project' },
        setCurrentProject: vi.fn(),
        isLoading: false,
        refreshProjects: vi.fn()
    })
}));

describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Basic check to confirm rendering happens. 
        // Actual content might change, so checking for ProjectSelector context or similar
    });

    it('does not show the ticket creation modal by default', () => {
        const { queryByText } = render(<App />);
        expect(queryByText('Crear Ticket en Azure DevOps')).toBeNull();
    });
});
