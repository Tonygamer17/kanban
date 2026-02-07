import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ColumnComponent } from '@/components/kanban/Column';
import { useKanbanStore } from '@/lib/store';
import { ColumnWithCards } from '@/types/kanban';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock do store
jest.mock('@/lib/store');

const mockUseKanbanStore = useKanbanStore as jest.MockedFunction<typeof useKanbanStore>;

// Mock data
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
      status: 'todo'
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
      status: 'todo'
    }
  ],
  cards: [] // Legacy compatibility
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

describe('ColumnComponent', () => {
  beforeEach(() => {
    mockUseKanbanStore.mockReturnValue({
      createCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders column title and card count', () => {
    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Column')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all cards in the column', () => {
    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows add card button', () => {
    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    expect(screen.getByText('Adicionar card')).toBeInTheDocument();
  });

  it('opens new card form when add card is clicked', async () => {
    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    const addButton = screen.getByText('Adicionar card');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título do card')).toBeInTheDocument();
    });
  });

  it('calls createCard when new card form is submitted', async () => {
    const mockCreateCard = jest.fn();
    mockUseKanbanStore.mockReturnValue({
      createCard: mockCreateCard,
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
    } as unknown as ReturnType<typeof useKanbanStore>);

    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    // Open form
    const addButton = screen.getByText('Adicionar card');
    fireEvent.click(addButton);

    // Fill form
    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('Título do card');
      fireEvent.change(titleInput, { target: { value: 'New Card' } });

      const descriptionInput = screen.getByPlaceholderText('Descrição (opcional)');
      fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    });

    // Submit form
    const saveButton = screen.getByText('Adicionar');
    fireEvent.click(saveButton);

    expect(mockCreateCard).toHaveBeenCalledWith(mockColumn.id, 'New Card', 'New Description');
  });

  it('shows delete confirmation when delete is clicked', async () => {
    // Mock window.confirm to return false (cancel deletion)
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    
    const mockDeleteColumn = jest.fn();
    mockUseKanbanStore.mockReturnValue({
      createCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: mockDeleteColumn,
    } as unknown as ReturnType<typeof useKanbanStore>);
    
    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    // Click delete button
    const deleteButton = screen.getByLabelText(`Delete column ${mockColumn.name}`);
    fireEvent.click(deleteButton);

    // Verify confirm was called but deleteColumn was NOT called (user cancelled)
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteColumn).not.toHaveBeenCalled();
    
    mockConfirm.mockRestore();
  });

  it('calls deleteColumn when deletion is confirmed', async () => {
    // Mock window.confirm
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    const mockDeleteColumn = jest.fn();
    mockUseKanbanStore.mockReturnValue({
      createCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: mockDeleteColumn,
    } as unknown as ReturnType<typeof useKanbanStore>);

    render(
      <TestWrapper>
        <ColumnComponent column={mockColumn} tasks={mockColumn.tasks} />
      </TestWrapper>
    );

    // Click delete button - using aria-label for the column
    const deleteButton = screen.getByLabelText(`Delete column ${mockColumn.name}`);
    fireEvent.click(deleteButton);

    // Verify confirm was called and then deleteColumn
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteColumn).toHaveBeenCalledWith(mockColumn.id);
    
    mockConfirm.mockRestore();
  });

  it('displays empty state when column has no tasks', () => {
    const emptyColumn = { ...mockColumn, tasks: [] };

    render(
      <TestWrapper>
        <ColumnComponent column={emptyColumn} tasks={emptyColumn.tasks} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Column')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Adicionar card')).toBeInTheDocument();
  });
});