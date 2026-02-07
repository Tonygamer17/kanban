import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { BoardComponent } from '@/components/kanban/Board';
import { useKanbanStore } from '@/lib/store';
import { BoardWithColumns } from '@/types/kanban';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

jest.mock('@/lib/store');
jest.mock('@/components/AuthContextProvider', () => ({
  useAuth: () => ({ user: { id: 'real-user-id' } }),
}));
jest.mock('@/lib/supabase', () => ({
  teamMembersApi: {
    getByTeamId: jest.fn(async () => []),
  },
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(async () => ({ data: [], error: null })),
      })),
    })),
  },
}));

const mockUseKanbanStore = useKanbanStore as jest.MockedFunction<typeof useKanbanStore>;

const mockBoard: BoardWithColumns = {
  id: 'board-1',
  name: 'Test Board',
  description: null,
  team_id: 'real-team-id',
  created_by: 'real-user-id',
  created_at: '2024-01-01',
  columns: [
    {
      id: 'col-1',
      name: 'To Do',
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
      ],
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

describe('BoardComponent', () => {
  beforeEach(() => {
    mockUseKanbanStore.mockReturnValue({
      createColumn: jest.fn(),
      moveTask: jest.fn(),
      updateBoard: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderBoard = async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <BoardComponent board={mockBoard} />
        </TestWrapper>
      );
    });
  };

  it('renders board title and column count', async () => {
    await renderBoard();

    expect(screen.getByText('Test Board')).toBeInTheDocument();
    expect(screen.getByText('1 colunas • 1 tasks')).toBeInTheDocument();
  });

  it('renders column with tasks', async () => {
    await renderBoard();

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('opens new column form when add column is clicked', async () => {
    await renderBoard();

    fireEvent.click(screen.getByText('Adicionar outra coluna'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nome da coluna')).toBeInTheDocument();
    });
  });
});
