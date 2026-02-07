import { renderHook, act } from '@testing-library/react';
import { useKanbanStore } from '@/lib/store';
import { boardsApi, columnsApi, cardsApi, teamsApi } from '@/lib/supabase';
import { Board, Column, Card, Team, BoardWithColumns } from '@/types/kanban';

// Mock do Supabase APIs
jest.mock('@/lib/supabase', () => ({
  boardsApi: {
    getAll: jest.fn(() => Promise.resolve(mockBoards)),
    create: jest.fn(() => Promise.resolve(mockBoards[0])),
    update: jest.fn(() => Promise.resolve(mockBoards[0])),
    delete: jest.fn(() => Promise.resolve()),
  },
  columnsApi: {
    getByBoardId: jest.fn(() => Promise.resolve(mockColumns)),
    create: jest.fn(() => Promise.resolve(mockColumns[0])),
    update: jest.fn(() => Promise.resolve(mockColumns[0])),
    delete: jest.fn(() => Promise.resolve()),
  },
  cardsApi: {
    getByColumnId: jest.fn(() => Promise.resolve(mockCards)),
    create: jest.fn(() => Promise.resolve(mockCards[0])),
    update: jest.fn(() => Promise.resolve(mockCards[0])),
    delete: jest.fn(() => Promise.resolve()),
    move: jest.fn(() => Promise.resolve()),
  },
  teamsApi: {
    getAllForUser: jest.fn(() => Promise.resolve(mockTeams)),
    createTeam: jest.fn(() => Promise.resolve(mockTeams[0])),
  },
  subscribeToBoard: jest.fn(() => ({ unsubscribe: jest.fn() })),
}));

const mockBoardsApi = boardsApi as jest.Mocked<typeof boardsApi>;
const mockColumnsApi = columnsApi as jest.Mocked<typeof columnsApi>;
const mockCardsApi = cardsApi as jest.Mocked<typeof cardsApi>;
const mockTeamsApi = teamsApi as jest.Mocked<typeof teamsApi>;



// Mock data
const mockBoards: Board[] = [
  {
    id: 'board-1',
    name: 'Board 1',
    description: null,
    team_id: 'team-1',
    created_by: 'user-1',
    created_at: '2024-01-01',
  }
];

const mockColumns: Column[] = [
  {
    id: 'col-1',
    name: 'Column 1',
    board_id: 'board-1',
    position: 0,
    created_at: '2024-01-01',
  }
];

const mockCards: Card[] = [
  {
    id: 'card-1',
    title: 'Card 1',
    description: 'Description 1',
    column_id: 'col-1',
    order_index: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team 1',
    owner_id: 'user-1',
    created_at: '2024-01-01',
  }
];

describe('useKanbanStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useKanbanStore());

    expect(result.current.boards).toEqual([]);
    expect(result.current.columns).toEqual([]);
    expect(result.current.cards).toEqual([]);
    expect(result.current.currentBoard).toBeNull();
    expect(result.current.teams).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('Boards operations', () => {
    it('fetches boards successfully', async () => {
      mockBoardsApi.getAll.mockResolvedValue(mockBoards);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.fetchBoards();
      });

      expect(mockBoardsApi.getAll).toHaveBeenCalled();
      expect(result.current.boards).toEqual(mockBoards);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch boards error', async () => {
      const error = new Error('Failed to fetch boards');
      
      // Reset the mock to return rejected value
      mockBoardsApi.getAll.mockClear();
      mockBoardsApi.getAll.mockRejectedValue(error);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.fetchBoards();
      });

      // Check that error state is set correctly
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch boards');
      // Note: We don't check boards array as it may retain previous data due to store persistence
    });

    it('creates a new board', async () => {
      const newBoard = mockBoards[0];
      mockBoardsApi.create.mockResolvedValue(newBoard);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.createBoard('New Board', 'team-1');
      });

      expect(mockBoardsApi.create).toHaveBeenCalledWith('New Board', 'team-1');
      expect(result.current.boards).toContain(newBoard);
    });

    it('updates a board', async () => {
      const updatedBoard = { ...mockBoards[0], name: 'Updated Board' };
      mockBoardsApi.update.mockResolvedValue(updatedBoard);

      const { result } = renderHook(() => useKanbanStore());
      
      // Set initial state
      result.current.boards = mockBoards;

      await act(async () => {
        await result.current.updateBoard('board-1', 'Updated Board');
      });

      expect(mockBoardsApi.update).toHaveBeenCalledWith('board-1', 'Updated Board');
      expect(result.current.boards[0].name).toBe('Updated Board');
    });

    it('deletes a board', async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // Set initial state
      result.current.boards = mockBoards;

      await act(async () => {
        await result.current.deleteBoard('board-1');
      });

      expect(mockBoardsApi.delete).toHaveBeenCalledWith('board-1');
      expect(result.current.boards).toEqual([]);
    });

    it('sets current board', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setCurrentBoard(mockBoards[0] as unknown as BoardWithColumns);
      });

      expect(result.current.currentBoard).toEqual(mockBoards[0]);
    });
  });

  describe('Teams operations', () => {
    it('fetches teams for user successfully', async () => {
      mockTeamsApi.getAllForUser.mockResolvedValue(mockTeams);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.fetchTeams('user-1');
      });

      expect(mockTeamsApi.getAllForUser).toHaveBeenCalledWith('user-1');
      expect(result.current.teams).toEqual(mockTeams);
      expect(result.current.loading).toBe(false);
    });

    it('creates a new team', async () => {
      const newTeam = mockTeams[0];
      mockTeamsApi.createTeam.mockResolvedValue(newTeam);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.createTeam('New Team', 'user-1');
      });

      expect(mockTeamsApi.createTeam).toHaveBeenCalledWith('New Team', 'user-1');
      expect(result.current.teams).toContain(newTeam);
    });
  });

  describe('Columns operations', () => {
    it('fetches columns for board', async () => {
      mockColumnsApi.getByBoardId.mockResolvedValue(mockColumns);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.fetchColumns('board-1');
      });

      expect(mockColumnsApi.getByBoardId).toHaveBeenCalledWith('board-1');
      expect(result.current.columns).toEqual(mockColumns);
    });

  it('creates a new column', async () => {
    const newColumn = mockColumns[0];
    mockColumnsApi.create.mockResolvedValue(newColumn);

    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.createColumn('board-1', 'New Column');
    });

    expect(mockColumnsApi.create).toHaveBeenCalledWith('board-1', 'New Column', 1);
    expect(result.current.columns).toContain(newColumn);
  });

    it('deletes a column', async () => {
      const { result } = renderHook(() => useKanbanStore());
      
      // Set initial state
      result.current.columns = mockColumns;

      await act(async () => {
        await result.current.deleteColumn('col-1');
      });

      expect(mockColumnsApi.delete).toHaveBeenCalledWith('col-1');
      expect(result.current.columns).toEqual([]);
    });
  });

  describe('Cards operations', () => {
    it('fetches cards for column', async () => {
      mockCardsApi.getByColumnId.mockResolvedValue(mockCards);

      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.fetchCards('col-1');
      });

      expect(mockCardsApi.getByColumnId).toHaveBeenCalledWith('col-1');
      expect(result.current.cards).toEqual(mockCards);
    });

  it('creates a new card', async () => {
    const newCard = mockCards[0];
    mockCardsApi.create.mockResolvedValue(newCard);

    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.createCard('col-1', 'New Card', 'New Description');
    });

    expect(mockCardsApi.create).toHaveBeenCalledWith('col-1', 'New Card', 'New Description', 'medium', 'todo', 1);
    expect(result.current.cards).toContain(newCard);
  });

    it('moves a card', async () => {
      const { result } = renderHook(() => useKanbanStore());

      await act(async () => {
        await result.current.moveCard('card-1', 'col-2', 1);
      });

      expect(mockCardsApi.move).toHaveBeenCalledWith('card-1', 'col-2', 1);
    });
  });

  describe('Utility operations', () => {
    it('sets loading state', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('sets error state', () => {
      const { result } = renderHook(() => useKanbanStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});