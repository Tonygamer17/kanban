import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { BoardComponent } from '@/components/kanban/Board';
import { useKanbanStore } from '@/lib/store';
import { BoardWithColumns } from '@/types/kanban';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock do store
jest.mock('@/lib/store');

const mockUseKanbanStore = useKanbanStore as jest.MockedFunction<typeof useKanbanStore>;

// Mock data
const mockBoard: BoardWithColumns = {
  id: 'board-1',
  name: 'Test Board',
  description: null,
  team_id: 'team-1',
  created_by: 'user-1',
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
          status: 'todo'
        }
      ],
      cards: []
    }
  ]
};

// Wrapper para testes
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <ThemeProvider>
      <DndContext>
        {children}
      </DndContext>
    </ThemeProvider>
  </ErrorBoundary>
);

describe('BoardComponent', () => {
  beforeEach(() => {
    mockUseKanbanStore.mockReturnValue({
      createColumn: jest.fn(),
      moveCard: jest.fn(),
      moveColumn: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders board title and column count', () => {
    render(
      <TestWrapper>
        <BoardComponent board={mockBoard} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Board')).toBeInTheDocument();
    expect(screen.getByText('1 colunas • 1 tasks')).toBeInTheDocument();
  });

  it('renders column with tasks', () => {
    render(
      <TestWrapper>
        <BoardComponent board={mockBoard} />
      </TestWrapper>
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows add column button', () => {
    render(
      <TestWrapper>
        <BoardComponent board={mockBoard} />
      </TestWrapper>
    );

    expect(screen.getByText('Adicionar outra coluna')).toBeInTheDocument();
  });

  it('opens new column form when add column is clicked', async () => {
    render(
      <TestWrapper>
        <BoardComponent board={mockBoard} />
      </TestWrapper>
    );

    const addButton = screen.getByText('Adicionar outra coluna');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nome da coluna')).toBeInTheDocument();
    });
  });

  it('calls createColumn when new column form is submitted', async () => {
    const mockCreateColumn = jest.fn();
    mockUseKanbanStore.mockReturnValue({
      createColumn: mockCreateColumn,
      moveCard: jest.fn(),
      moveColumn: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);

    render(
      <TestWrapper>
        <BoardComponent board={mockBoard} />
      </TestWrapper>
    );

    // Open form
    const addButton = screen.getByText('Adicionar outra coluna');
    fireEvent.click(addButton);

    // Fill form
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Nome da coluna');
      fireEvent.change(input, { target: { value: 'New Column' } });
    });

    // Submit form
    const saveButton = screen.getByText('Adicionar');
    fireEvent.click(saveButton);

    expect(mockCreateColumn).toHaveBeenCalledWith(mockBoard.id, 'New Column');
  });

  it('renders without crashing with minimal props', () => {
    mockUseKanbanStore.mockReturnValue({
      createColumn: jest.fn(),
      moveCard: jest.fn(),
      moveColumn: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);

    render(
      <TestWrapper>
        <BoardComponent board={mockBoard} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Board')).toBeInTheDocument();
  });
});