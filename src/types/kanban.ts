// Kanban App Types - Alinhado com schema Supabase

export interface Team {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

export interface TeamMember {
  team_id: string;
  profile_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface Board {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  position: number;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  assignee_id: string;
  assigned_at: string;
  assigned_by: string;
}

// Extended types with nested data
export interface ColumnWithCards extends Column {
  tasks: Task[];
}

export interface BoardWithColumns extends Board {
  columns: ColumnWithCards[];
}

// Store state types
export interface KanbanState {
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  currentBoard: BoardWithColumns | null;
  teams: Team[];
  loading: boolean;
  error: string | null;
}

// Store actions types
export interface KanbanActions {
  // Boards
  fetchBoards: () => Promise<void>;
  createBoard: (title: string, teamId: string) => Promise<void>;
  updateBoard: (id: string, title: string, description?: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  setCurrentBoard: (board: BoardWithColumns | null) => void;
  
  // Teams actions
  fetchTeams: (userId: string) => Promise<void>;
  createTeam: (name: string, ownerId: string) => Promise<Team>;
  
  // Columns
  fetchColumns: (boardId: string) => Promise<void>;
  createColumn: (boardId: string, title: string) => Promise<void>;
  updateColumn: (id: string, title: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  moveColumn: (columnId: string, newIndex: number) => Promise<void>;
  
  // Tasks
  fetchTasks: (columnId: string) => Promise<void>;
  createTask: (columnId: string, title: string, description?: string) => Promise<void>;
  updateTask: (id: string, title: string, description?: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, targetColumnId: string, newIndex: number) => Promise<void>;
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Form types
export interface CreateBoardForm {
  title: string;
  description?: string;
}

export interface CreateColumnForm {
  name: string;
}

export interface CreateTaskForm { // Renamed from CreateCardForm
  title: string;
  description?: string;
}

export interface UpdateTaskForm { // Renamed from UpdateCardForm
  title: string;
  description?: string;
}

// Drag and Drop types
export interface DragEndData {
  taskId: string; // Renamed from cardId
  sourceColumnId: string;
  targetColumnId: string;
  newIndex: number;
}
