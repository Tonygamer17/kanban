import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  KanbanState,
  KanbanActions,
  BoardWithColumns,
  ColumnWithCards,
  Task,
} from '@/types/kanban';
import {
  boardsApi,
  columnsApi,
  tasksApi,
  subscribeToBoard,
  teamsApi,
} from '@/lib/supabase';

type KanbanStore = KanbanState & KanbanActions;
let fetchTeamsRequestId = 0;

const dedupeTeamsById = <T extends { id: string }>(teams: T[]): T[] => {
  const byId = new Map<string, T>();
  for (const team of teams) {
    if (team?.id && !byId.has(team.id)) {
      byId.set(team.id, team);
    }
  }
  return Array.from(byId.values());
};

export const useKanbanStore = create<KanbanStore>()(
  devtools(
    (set, get) => ({
      boards: [],
      columns: [],
      tasks: [],
      currentBoard: null,
      teams: [],
      loading: false,
      error: null,

      fetchBoards: async () => {
        set({ loading: true, error: null });
        try {
          const boards = await boardsApi.getAll();
          set({ boards, loading: false });
        } catch (error) {
          console.error('ERROR: fetchBoards failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch boards',
            loading: false,
          });
        }
      },

      createBoard: async (title: string, teamId: string) => {
        set({ loading: true, error: null });
        try {
          const newBoard = await boardsApi.create(title, teamId);
          set((state) => ({
            boards: [newBoard, ...state.boards],
            loading: false,
          }));
        } catch (error) {
          console.error('ERROR: createBoard failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create board',
            loading: false,
          });
        }
      },

      updateBoard: async (id: string, title: string, description?: string) => {
        set({ loading: true, error: null });
        try {
          const updatedBoard = await boardsApi.update(id, title, description);
          set((state) => ({
            boards: state.boards.map((board) => (board.id === id ? updatedBoard : board)),
            currentBoard:
              state.currentBoard?.id === id
                ? { ...state.currentBoard, ...updatedBoard }
                : state.currentBoard,
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update board',
            loading: false,
          });
        }
      },

      deleteBoard: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await boardsApi.delete(id);
          set((state) => ({
            boards: state.boards.filter((board) => board.id !== id),
            currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete board',
            loading: false,
          });
        }
      },

      fetchTeams: async (userId: string) => {
        const requestId = ++fetchTeamsRequestId;
        set({ loading: true, error: null });
        try {
          const teams = await teamsApi.getAllForUser(userId);
          if (requestId !== fetchTeamsRequestId) {
            return;
          }

          set({ teams: dedupeTeamsById(teams || []), loading: false });
        } catch (error) {
          if (requestId !== fetchTeamsRequestId) {
            return;
          }

          console.error('ERROR: fetchTeams failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch teams',
            loading: false,
          });
        }
      },

      createTeam: async (name: string, ownerId: string) => {
        set({ loading: true, error: null });
        try {
          const newTeam = await teamsApi.createTeam(name, ownerId);
          set((state) => ({
            teams: state.teams.some((team) => team.id === newTeam.id)
              ? state.teams
              : dedupeTeamsById([...state.teams, newTeam]),
            loading: false,
          }));
          return newTeam;
        } catch (error) {
          console.error('ERROR: createTeam failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create team',
            loading: false,
          });
          throw error;
        }
      },

      setCurrentBoard: (board: BoardWithColumns | null) => {
        set({ currentBoard: board });
        if (board) {
          subscribeToBoard(board.id, () => {
            fetchBoardWithColumns(board.id).then((updatedBoard) => {
              if (updatedBoard) {
                get().setCurrentBoard(updatedBoard);
              }
            });
          });
        }
      },

      fetchColumns: async (boardId: string) => {
        set({ loading: true, error: null });
        try {
          const columns = await columnsApi.getByBoardId(boardId);
          set({ columns, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch columns',
            loading: false,
          });
        }
      },

      createColumn: async (boardId: string, title: string) => {
        set({ loading: true, error: null });
        try {
          const { columns } = get();
          const position = columns.length;
          const newColumn = await columnsApi.create(boardId, title, position);
          set((state) => ({
            columns: [...state.columns, newColumn],
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create column',
            loading: false,
          });
        }
      },

      updateColumn: async (id: string, title: string) => {
        set({ loading: true, error: null });
        try {
          const updatedColumn = await columnsApi.update(id, title);
          set((state) => ({
            columns: state.columns.map((column) => (column.id === id ? updatedColumn : column)),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update column',
            loading: false,
          });
        }
      },

      deleteColumn: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await columnsApi.delete(id);
          set((state) => ({
            columns: state.columns.filter((column) => column.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete column',
            loading: false,
          });
        }
      },

      moveColumn: async (columnId: string, newIndex: number) => {
        set({ loading: true, error: null });
        try {
          await columnsApi.reorder(columnId, newIndex);
          const { columns } = get();
          const columnToMove = columns.find((col) => col.id === columnId);
          if (!columnToMove) {
            set({ loading: false });
            return;
          }

          const newColumns = [...columns];
          newColumns.splice(columns.indexOf(columnToMove), 1);
          newColumns.splice(newIndex, 0, { ...columnToMove, position: newIndex });

          set({ columns: newColumns, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to move column',
            loading: false,
          });
        }
      },

      fetchTasks: async (columnId: string) => {
        set({ loading: true, error: null });
        try {
          const tasks = await tasksApi.getByColumnId(columnId);
          set((state) => ({
            tasks: [...state.tasks.filter((task) => task.column_id !== columnId), ...tasks],
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch tasks',
            loading: false,
          });
        }
      },

      createTask: async (columnId: string, title: string, description?: string) => {
        set({ loading: true, error: null });
        try {
          const { tasks } = get();
          const position = tasks.filter((task) => task.column_id === columnId).length;
          const newTask = await tasksApi.create(columnId, title, description || '', 'medium', 'todo', position);
          set((state) => ({
            tasks: [...state.tasks, newTask],
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create task',
            loading: false,
          });
        }
      },

      updateTask: async (id: string, title: string, description?: string) => {
        set({ loading: true, error: null });
        try {
          const updates: { title: string; description?: string } = { title };
          if (description !== undefined) {
            updates.description = description;
          }
          const updatedTask = await tasksApi.update(id, updates);
          set((state) => ({
            tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update task',
            loading: false,
          });
        }
      },

      deleteTask: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await tasksApi.delete(id);
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete task',
            loading: false,
          });
        }
      },

      moveTask: async (taskId: string, targetColumnId: string, newIndex: number) => {
        set({ loading: true, error: null });
        try {
          await tasksApi.move(taskId, targetColumnId, newIndex);

          const { tasks } = get();
          const taskToMove = tasks.find((task) => task.id === taskId);
          if (!taskToMove) {
            set({ loading: false });
            return;
          }

          const updatedTask = { ...taskToMove, column_id: targetColumnId, position: newIndex };
          set((state) => ({
            tasks: state.tasks.map((task) => (task.id === taskId ? updatedTask : task)),
            loading: false,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to move task',
            loading: false,
          });
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'kanban-store',
    }
  )
);

export const fetchBoardWithColumns = async (boardId: string): Promise<BoardWithColumns | null> => {
  try {
    const board = await boardsApi.getById(boardId);
    if (!board) {
      return null;
    }

    const columnsWithTasks: ColumnWithCards[] = board.columns.map((column: ColumnWithCards) => ({
      ...column,
      tasks: (column.tasks as Task[]) || [],
    }));

    return {
      ...board,
      columns: columnsWithTasks,
    };
  } catch (error) {
    console.error('ERROR: Failed to fetch board with columns:', error);
    return null;
  }
};
