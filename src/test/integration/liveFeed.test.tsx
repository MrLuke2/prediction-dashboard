import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LiveFeed } from '../../components/widgets/LiveFeed';
import { resetStores } from '../mocks/storeDefaults';
import { useUIStore } from '../../store';
import { LogLevel } from '../../types';

describe('LiveFeed Integration', () => {
    beforeEach(() => {
        resetStores();
    });

    it('shows empty state when no logs', () => {
        render(<LiveFeed />);
        expect(screen.getByText(/Circuit Silent/i)).toBeInTheDocument();
    });

    it('renders logs with correct agent and level branding', async () => {
        const mockLogs = [
            {
                id: '1',
                timestamp: Date.now(),
                level: LogLevel.INFO,
                agent: 'FUNDAMENTALIST',
                message: 'Bullish macro sentiment detected',
                providerId: 'anthropic'
            },
            {
                id: '2',
                timestamp: Date.now(),
                level: LogLevel.DEBATE,
                agent: 'ORCHESTRATOR',
                message: 'Council debate initiated',
                providerId: 'openai'
            }
        ];

        useUIStore.setState({ logs: mockLogs as any });

        render(<LiveFeed />);

        expect(await screen.findByText('FUNDAMENTALIST')).toBeInTheDocument();
        expect(screen.getByText('Bullish macro sentiment detected')).toBeInTheDocument();
        expect(screen.getByText('ORCHESTRATOR')).toBeInTheDocument();
        expect(screen.getByText('Council debate initiated')).toBeInTheDocument();
        expect(screen.getByText('COUNCIL DEBATE')).toBeInTheDocument();
    });

    it('filters logs by level', async () => {
        const mockLogs = [
            {
                id: '1',
                timestamp: Date.now(),
                level: LogLevel.INFO,
                agent: 'FUND',
                message: 'info message',
                providerId: 'anthropic'
            },
            {
                id: '2',
                timestamp: Date.now(),
                level: LogLevel.ERROR,
                agent: 'RISK',
                message: 'error message',
                providerId: 'openai'
            },
            {
                id: '3',
                timestamp: Date.now(),
                level: LogLevel.DEBATE,
                agent: 'ORCH',
                message: 'debate message',
                providerId: 'gemini'
            }
        ];

        useUIStore.setState({ logs: mockLogs as any });

        render(<LiveFeed />);

        // Initial state: all logs
        expect(screen.getByText('info message')).toBeInTheDocument();
        expect(screen.getByText('error message')).toBeInTheDocument();
        expect(screen.getByText('debate message')).toBeInTheDocument();

        // Filter by ALERT (ERROR)
        const alertBtn = screen.getByText('ALERT');
        fireEvent.click(alertBtn);

        expect(screen.queryByText('info message')).not.toBeInTheDocument();
        expect(screen.getByText('error message')).toBeInTheDocument();
        expect(screen.queryByText('debate message')).not.toBeInTheDocument();

        // Filter by DEBATE
        const debateBtn = screen.getByText('DEBATE');
        fireEvent.click(debateBtn);

        expect(screen.queryByText('error message')).not.toBeInTheDocument();
        expect(screen.getByText('debate message')).toBeInTheDocument();
    });

    it('reflects AI provider switch in labels', () => {
        const mockLogs = [
            {
                id: '1',
                timestamp: Date.now(),
                level: LogLevel.INFO,
                agent: 'ORCHESTRATOR',
                message: 'Running...',
                providerId: 'anthropic'
            }
        ];

        useUIStore.setState({ 
            logs: mockLogs as any,
            aiProvider: { providerId: 'openai', model: 'gpt-4o' }
        });

        const { rerender } = render(<LiveFeed />);

        // Should show GPT (OpenAI) since Orchestrator follows global provider
        expect(screen.getByText(/GPT/i)).toBeInTheDocument();

        // Switch provider
        useUIStore.setState({ aiProvider: { providerId: 'gemini', model: 'gemini-1.5-pro' } });
        rerender(<LiveFeed />);

        expect(screen.getByText(/Gemini/i)).toBeInTheDocument();
    });
});
