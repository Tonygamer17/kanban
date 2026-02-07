import { renderHook, act } from '@testing-library/react';
import { useKanbanStore } from '@/lib/store';
import { boardsApi, columnsApi, tasksApi, teamsApi } from '@/lib/supabase';
import { Board, Column, Task, Team } from '@/types/kanban';

jest.mock('@/lib/supabase', () => ({
  boardsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
  },
  columnsApi: {
    getByBoardId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    reorder: jest.fn(),
  },
  tasksApi: {
    getByColumnId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    move: jest.fn(),
  },
  teamsApi: {
    getAllForUser: jest.fn(),
    createTeam: jest.fn(),
  },
  subscribeToBoard: jest.fn(),
}));

const mockBoardsApi = boardsApi as jest.Mocked<typeof boardsApi>;
const mockColumnsApi = columnsApi as jest.Mocked<typeof columnsApi>;
const mockTasksApi = tasksApi as jest.Mocked<typeof tasksApi>;
const mockTeamsApi = teamsApi as jest.Mocked<typeof teamsApi>;

const mockBoards: Board[] = [
  {
    id: 'board-1',
    name: 'Board 1',
    description: null,
    team_id: 'team-1',
    created_by: 'user-1',
    created_at: '2024-01-01',
  },
];

const mockColumns: Column[] = [
  {
    id: 'col-1',
    name: 'Column 1',
    board_id: 'board-1',
    position: 0,
    created_at: '2024-01-01',
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    column_id: 'col-1',
    position: 0,
    created_at: '2024-01-01',
    due_date: null,
    priority: 'medium',
    status: 'todo',
  },
];

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team 1',
    owner_id: 'user-1',
    created_at: '2024-01-01',
  },
];

describe('useKanbanStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useKanbanStore.setState({
      boards: [],
      columns: [],
      tasks: [],
      currentBoard: null,
      teams: [],
      loading: false,
      error: null,
    });
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useKanbanStore());

    expect(result.current.boards).toEqual([]);
    expect(result.current.columns).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.currentBoard).toBeNull();
    expect(result.current.teams).toEqual([]);
  });

  it('fetches boards successfully', async () => {
    mockBoardsApi.getAll.mockResolvedValue(mockBoards);
    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.fetchBoards();
    });

    expect(mockBoardsApi.getAll).toHaveBeenCalled();
    expect(result.current.boards).toEqual(mockBoards);
  });

  it('fetches teams successfully', async () => {
    mockTeamsApi.getAllForUser.mockResolvedValue(mockTeams);
    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.fetchTeams('user-1');
    });

    expect(mockTeamsApi.getAllForUser).toHaveBeenCalledWith('user-1');
    expect(result.current.teams).toEqual(mockTeams);
  });

  it('fetches columns successfully', async () => {
    mockColumnsApi.getByBoardId.mockResolvedValue(mockColumns);
    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.fetchColumns('board-1');
    });

    expect(mockColumnsApi.getByBoardId).toHaveBeenCalledWith('board-1');
    expect(result.current.columns).toEqual(mockColumns);
  });

  it('fetches tasks successfully', async () => {
    mockTasksApi.getByColumnId.mockResolvedValue(mockTasks);
    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.fetchTasks('col-1');
    });

    expect(mockTasksApi.getByColumnId).toHaveBeenCalledWith('col-1');
    expect(result.current.tasks).toEqual(mockTasks);
  });

  it('creates task successfully', async () => {
    mockTasksApi.create.mockResolvedValue(mockTasks[0]);
    const { result } = renderHook(() => useKanbanStore());

    await act(async () => {
      await result.current.createTask('col-1', 'Task 1', 'Description 1');
    });

    expect(mockTasksApi.create).toHaveBeenCalledWith('col-1', 'Task 1', 'Description 1', 'medium', 'todo', 0);
    expect(result.current.tasks).toHaveLength(1);
  });

  it('moves task successfully', async () => {
    mockTasksApi.move.mockResolvedValue(mockTasks[0]);
    useKanbanStore.setState({ tasks: mockTasks });

    const { result } = renderHook(() => useKanbanStore());
    await act(async () => {
      await result.current.moveTask('task-1', 'col-2', 1);
    });

    expect(mockTasksApi.move).toHaveBeenCalledWith('task-1', 'col-2', 1);
  });
});
