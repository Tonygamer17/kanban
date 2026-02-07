import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnComponent } from '@/components/kanban/Column';
import { useKanbanStore } from '@/lib/store';
import { ColumnWithCards } from '@/types/kanban';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

jest.mock('@/lib/store');

const mockUseKanbanStore = useKanbanStore as jest.MockedFunction<typeof useKanbanStore>;

const mockColumn: ColumnWithCards = {
  id: 'col-1',
  name: 'Test Column',
  board_id: 'board-1',
  position: 0,
  created_at: '2024-01-01',
  tasks: [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: 'Test Description',
      column_id: 'col-1',
      position: 0,
      created_at: '2024-01-01',
      due_date: null,
      priority: 'medium',
      status: 'todo',
    },
    {
      id: 'task-2',
      title: 'Test Task 2',
      description: null,
      column_id: 'col-1',
      position: 1,
      created_at: '2024-01-01',
      due_date: null,
      priority: 'medium',
      status: 'todo',
    },
  ],
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <ThemeProvider>
      <DndContext>{children}</DndContext>
    </ThemeProvider>
  </ErrorBoundary>
);

describe('ColumnComponent', () => {
  beforeEach(() => {
    mockUseKanbanStore.mockReturnValue({
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderColumn = () =>
    render(
      <TestWrapper>
        <ColumnComponent
          column={mockColumn}
          tasks={mockColumn.tasks}
          teamId="real-team-id"
          currentUserId="real-user-id"
          teamMembers={[]}
          taskAssigneesMap={{}}
          onTaskAssigneesChange={jest.fn()}
        />
      </TestWrapper>
    );

  it('renders column title and task count', () => {
    renderColumn();
    expect(screen.getByText('Test Column')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all tasks in the column', () => {
    renderColumn();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('opens new task form when add task is clicked', async () => {
    renderColumn();
    fireEvent.click(screen.getByText('Adicionar task'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título da task')).toBeInTheDocument();
    });
  });
});
