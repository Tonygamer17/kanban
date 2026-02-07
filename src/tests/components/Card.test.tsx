import { render, screen } from '@testing-library/react';
import { Card } from '@/components/kanban/Card';
import { mockTask } from '../__mocks__/kanban';

jest.mock('@/lib/store', () => ({
  useKanbanStore: () => ({
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  }),
}));

describe('Card Component', () => {
  const defaultProps = {
    task: mockTask,
    teamId: 'real-team-id',
    currentUserId: 'real-user-id',
    teamMembers: [{ team_id: 'real-team-id', profile_id: 'real-user-id', role: 'owner' as const, joined_at: '2024-01-01' }],
    assignees: [],
    onAssigneesChange: jest.fn(),
  };

  it('renders task title correctly', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders task description when provided', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows edit and delete buttons', () => {
    render(<Card {...defaultProps} />);
    const editButton = screen.getByRole('button', { name: /edit task/i });
    const deleteButton = screen.getByRole('button', { name: /delete task/i });

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
});
