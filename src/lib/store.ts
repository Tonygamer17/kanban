import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  KanbanState, 
  KanbanActions, 
  BoardWithColumns, 
  ColumnWithCards
} from '@/types/kanban';
import { 
  boardsApi, 
  columnsApi, 
  cardsApi, 
  subscribeToBoard,
  teamsApi // <-- New import
} from '@/lib/supabase';
import { supabase } from '@/lib/supabase';


type KanbanStore = KanbanState & KanbanActions;

export const useKanbanStore = create<KanbanStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      boards: [],
      columns: [],
      cards: [],
      currentBoard: null,
      teams: [], // <-- Added teams to initial state
      loading: false,
      error: null,

      // Boards actions
      fetchBoards: async () => {
        set({ loading: true, error: null });
        try {
          const boards = await boardsApi.getAll();
          set({ boards, loading: false });
        } catch (error) {
          console.error('❌ ERROR: fetchBoards failed:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch boards',
            loading: false 
          });
        }
      },

      createBoard: async (title: string, teamId: string) => { // Added teamId parameter
        set({ loading: true, error: null });
        try {
          const newBoard = await boardsApi.create(title, teamId); // Pass teamId to boardsApi.create
          set(state => ({ 
            boards: [newBoard, ...state.boards],
            loading: false 
          }));
        } catch (error) {
          console.error('❌ ERROR: createBoard failed:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create board',
            loading: false 
          });
        }
      },

      updateBoard: async (id: string, title: string) => {
        set({ loading: true, error: null });
        try {
          const updatedBoard = await boardsApi.update(id, title);
          set(state => ({
            boards: state.boards.map(board => 
              board.id === id ? updatedBoard : board
            ),
            currentBoard: state.currentBoard?.id === id 
              ? { ...state.currentBoard, ...updatedBoard }
              : state.currentBoard,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update board',
            loading: false 
          });
        }
      },

      deleteBoard: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await boardsApi.delete(id);
          set(state => ({
            boards: state.boards.filter(board => board.id !== id),
            currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete board',
            loading: false 
          });
        }
      },

      // Teams actions
      fetchTeams: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const teams = await teamsApi.getAllForUser(userId);
          set({ teams: teams || [], loading: false });
        } catch (error) {
          console.error('❌ ERROR: fetchTeams failed:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch teams',
            loading: false 
          });
        }
      },

      createTeam: async (name: string, ownerId: string) => {
        set({ loading: true, error: null });
        try {
          const newTeam = await teamsApi.createTeam(name, ownerId);
          set(state => ({ 
            teams: [...state.teams, newTeam],
            loading: false 
          }));
          return newTeam;
        } catch (error) {
          console.error('❌ ERROR: createTeam failed:', JSON.stringify(error, null, 2)); // Detailed error logging
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create team',
            loading: false 
          });
          throw error;
        }
      },

      setCurrentBoard: (board: BoardWithColumns | null) => {
        set({ currentBoard: board });
        if (board) {
          // Subscribe to real-time updates
          const subscription = subscribeToBoard(board.id, () => {
            // Refetch data when changes occur
            fetchBoardWithColumns(board.id).then(updatedBoard => {
              if (updatedBoard) {
                get().setCurrentBoard(updatedBoard);
              }
            });
          });
          
          return () => {
            supabase.removeChannel(subscription);
          };
        }
      },

      // Columns actions
      fetchColumns: async (boardId: string) => {
        set({ loading: true, error: null });
        try {
          const columns = await columnsApi.getByBoardId(boardId);
          set({ columns, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch columns',
            loading: false 
          });
        }
      },

      createColumn: async (boardId: string, title: string) => {
        set({ loading: true, error: null });
        try {
          const { columns } = get();
          const orderIndex = columns.length;
          const newColumn = await columnsApi.create(boardId, title, orderIndex);
          set(state => ({ 
            columns: [...state.columns, newColumn],
            loading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create column',
            loading: false 
          });
        }
      },

      updateColumn: async (id: string, title: string) => {
        set({ loading: true, error: null });
        try {
          const updatedColumn = await columnsApi.update(id, title);
          set(state => ({
            columns: state.columns.map(column => 
              column.id === id ? updatedColumn : column
            ),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update column',
            loading: false 
          });
        }
      },

      deleteColumn: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await columnsApi.delete(id);
          set(state => ({
            columns: state.columns.filter(column => column.id !== id),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete column',
            loading: false 
          });
        }
      },

      moveColumn: async (columnId: string, newIndex: number) => {
        set({ loading: true, error: null });
        try {
          await columnsApi.reorder(columnId, newIndex);
          // Update local state
          const { columns } = get();
          const columnToMove = columns.find(col => col.id === columnId);
          if (!columnToMove) return;

          const newColumns = [...columns];
          newColumns.splice(columns.indexOf(columnToMove), 1);
          newColumns.splice(newIndex, 0, columnToMove);

          set({ columns: newColumns, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to move column',
            loading: false 
          });
        }
      },

      // Cards actions
      fetchCards: async (columnId: string) => {
        set({ loading: true, error: null });
        try {
          const cards = await cardsApi.getByColumnId(columnId);
          set(state => ({
            cards: [...state.cards.filter(card => card.column_id !== columnId), ...cards],
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch cards',
            loading: false 
          });
        }
      },

      createCard: async (columnId: string, title: string, description?: string) => {
        set({ loading: true, error: null });
        try {
          const { cards } = get();
          const position = cards.filter(card => card.column_id === columnId).length;
          const newCard = await cardsApi.create(columnId, title, description, 'medium', 'todo', position);
          set(state => ({ 
            cards: [...state.cards, newCard],
            loading: false 
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create card',
            loading: false 
          });
        }
      },

      updateCard: async (id: string, title: string, description?: string) => {
        set({ loading: true, error: null });
        try {
          const updates: { title: string; description?: string } = { title };
          if (description !== undefined) {
            updates.description = description;
          }
          const updatedCard = await cardsApi.update(id, updates);
          set(state => ({
            cards: state.cards.map(card => 
              card.id === id ? updatedCard : card
            ),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update card',
            loading: false 
          });
        }
      },

      deleteCard: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await cardsApi.delete(id);
          set(state => ({
            cards: state.cards.filter(card => card.id !== id),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete card',
            loading: false 
          });
        }
      },

      moveCard: async (cardId: string, targetColumnId: string, newIndex: number) => {
        set({ loading: true, error: null });
        try {
          await cardsApi.move(cardId, targetColumnId, newIndex);
          
          // Update local state
          const { cards } = get();
          const cardToMove = cards.find(card => card.id === cardId);
          if (!cardToMove) return;

          const updatedCard = { ...cardToMove, column_id: targetColumnId, order_index: newIndex };
          set(state => ({
            cards: state.cards.map(card => 
              card.id === cardId ? updatedCard : card
            ),
            loading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to move card',
            loading: false 
          });
        }
      },

      // Utility actions
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'kanban-store'
    }
  )
);

// Helper function to fetch board with all related data
export const fetchBoardWithColumns = async (boardId: string): Promise<BoardWithColumns | null> => {
  try {
    const board = await boardsApi.getById(boardId);
    
    if (!board) {
      return null;
    }

    const columnsWithCards: ColumnWithCards[] = board.columns.map((column: ColumnWithCards) => ({
      ...column,
      cards: column.cards || []
    }));

    
    return {
      ...board,
      columns: columnsWithCards
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch board with columns:', error);
    return null;
  }
};